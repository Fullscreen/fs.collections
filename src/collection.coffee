app = angular.module('fs.collections')

app.factory 'BaseCollection', ['$http', 'BaseModel', 'fsCache', ($http, BaseModel, fsCache) ->
  class BaseCollection extends fsCache
    model: BaseModel
    currentlyFetching: false

    constructor: (models, @opts) ->
      if @opts
        @model = @opts.model if @opts.model
        @url = @opts.url if @opts.url
        @sort = @opts.sort if @opts.sort
        @comparator = @opts.comparator if @opts.comparator
        if @opts.parse && typeof @opts.parse == 'function'
          @parse = @opts.parse
          delete @opts.parse
      @models = []
      @length = 0
      @add models, @opts

    url: ->

    parse: (res) -> res.data

    fetch: (options) ->
      defaults =
        cache: @cache
        cacheTTL: @cacheTTL
        merge: true
        parse: true
        method: 'GET'
        url: _(@).result('url')

      options = _.extend(defaults, options)
      options.params = _.extend({}, options.params) if options.params
      options.data   = _.extend({}, options.data) if options.data

      @currentlyFetching = true
      req = $http(options).then (models) =>
        @scheduleCacheTimeout(options)
        @reset() if options.reset
        @add(models, options)
        @

      req.finally => @currentlyFetching = false

      return req

    eq: (index) -> @models?[index]

    get: (id) ->
      _(@models).findWhere id: id

    remove: (models) ->
      isSingular = ! _(models).isArray()
      models = [models] if isSingular
      removed = []

      _(models).forEach (model) =>
        index = @indexOf(model)
        return if index is -1
        removed.push model
        @models.splice index, 1
        @length--

      if isSingular then removed[0] else removed

    add: (models, options) ->
      options = _.extend({sort: true}, options)

      models = @parse(models) if options.parse
      return unless models

      isSingular = ! _(models).isArray()
      models =  if isSingular then [models] else models.slice()
      added = []
      insertAt = if typeof options.at is 'undefined' then @length else options.at

      models.forEach (model) =>
        model = @_prepareModel(model, options)

        # Add this model unless we already have it in the collection
        colModel = @get(model.id)
        unless colModel?
          added.push(model)
          @length++
          @models.splice(insertAt, 0, model)
          insertAt++
        else if options.merge
          colModel.set(model.attributes)

      @sort() if options.sort

      return if isSingular then added[0] else added

    create: (attrs, opts) ->
      instance = @add(attrs, opts)
      instance.save() if instance

    clone: () ->
      new @constructor(@toJSON(), @opts)

    toJSON: () ->
      _.map @models, (model) ->
        model.toJSON()

    reset: ->
      @models = []
      @length = 0
      @

    sort: ->
      if @comparator then @models.sort(@comparator)

    _prepareModel: (attrs, options) ->
      options = _.extend({collection: @}, options)
      if attrs instanceof @model
        model = attrs
        model.collection = @
      else
        model = new @model(attrs, options)
      return model

    pluck: (attr) ->
      _.invoke(@models, 'get', attr)

    where: (attrs, first) ->
      if not attrs
        return if first then undefined else []

      @[if first then 'find' else 'filter'] (model) ->
        for key, value of attrs
          if attrs[key] isnt model.get(key) then return false
        return true

    findWhere: (attrs) ->
      @where(attrs, true)

  # From the Backbone source: https://github.com/jashkenas/backbone/blob/master/backbone.js#L942
  # Underscore methods that we want to implement on the Collection.
  # 90% of the core usefulness of Backbone Collections is actually implemented
  # right here:
  methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain']

  # Mix in each Underscore method as a proxy to `Collection#models`.
  _.each methods, (method) ->
    BaseCollection::[method] = (args...) ->
      args.unshift @models
      _[method].apply(_, args)

  # Underscore methods that take a property name as an argument.
  attributeMethods = ['groupBy', 'countBy', 'sortBy']

  # Use attributes instead of properties.
  _.each attributeMethods, (method) ->
    BaseCollection::[method] = (value, context) ->
      iterator = if _.isFunction value then value else (model) -> model.get(value)
      return _[method](@models, iterator, context)

  return BaseCollection
]
