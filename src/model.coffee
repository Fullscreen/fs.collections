app = angular.module('fs.collections')

app.factory 'BaseModel', ['$http', '$rootScope', ($http, $rootScope) ->
  class BaseModel
    parse: (res) ->
      if res.status && res.headers
        res.data
      else
        res

    _hasIdAttribute: (attrs) ->
      _(Object.keys(attrs)).contains(@idAttribute)

    constructor: (attrs = {}, opts = {}) ->
      attrs = @parse(attrs) if opts.parse
      @_eventBus = $rootScope.$new()
      @_eventBus.destuctors = {}
      @_eventBus.$on '$destroy', =>
        _(@_eventBus.destuctors).each (callbacks, event) ->
          callbacks.forEach (obj) -> obj.unwatch()

      @collection = opts.collection if opts.collection
      @urlRoot = opts.urlRoot if opts.urlRoot
      @idAttribute = opts.idAttribute if opts.idAttribute
      @defaults = opts.defaults if opts.defaults

      @attributes = {}
      attrs = _.extend({}, attrs)
      attrs = _.defaults(attrs, _.result(@, 'defaults'))
      @set(attrs)

    trigger: (args...) -> @_eventBus.$broadcast.apply(@_eventBus, args)

    # Wrap the bound callback to strip off the `scope` arg, as we don't want to
    # expose that publicly
    on: (event, cb) ->
      @_eventBus.destuctors[event] = [] unless @_eventBus.destuctors[event]
      queue = @_eventBus.destuctors[event]
      wrapped = (scope, e, args...) -> cb.apply(@, [e].concat(args))

      queue.push
        unwatch: @_eventBus.$on(event, wrapped)
        original: cb

    off: (event, cb) ->
      callbacks = @_eventBus.destuctors[event] || []
      matches = []

      if cb then matches = callbacks.filter (obj) -> obj.original is cb
      else       matches = callbacks

      matches.forEach (obj) -> obj.unwatch()

    once: (event, cb) ->
      wrapped = (args...) =>
        @off(event, wrapped)
        cb.apply(@, args)

      @on event, wrapped

    has: (key) -> @attributes[key]?

    get: (key) -> @attributes[key]

    set: (key, val) ->
      unless key then return @

      if typeof key is 'object'
        attrs = key
      else
        attrs = {}
        attrs[key] = val

      changed = {}

      @id = attrs[@idAttribute] if @_hasIdAttribute(attrs)

      _(attrs).each (aVal, aKey) =>
        changed[aKey] = aVal if @attributes[aKey] isnt aVal
        @attributes[aKey] = aVal

      @trigger('change', @, changed)
      _(changed).each (val, key) => @trigger("change:#{key}", @, val)

      @

    urlRoot: ''

    idAttribute: 'id'

    isNew: -> if @id? then false else true

    url: ->
      base = _.result(@, 'urlRoot') or _.result(@collection, 'url')
      if @isNew()
        base
      else
        id = encodeURIComponent(@id)
        base + if base.charAt(base.length - 1) is '/' then id else '/' + id

    toJSON: ->
      _.clone(@attributes)

    fetch: (options = {}) ->
      opts = _.extend({}, options)

      _(opts).defaults
        method: 'GET'
        url: _.result(@, 'url')
      $http(opts).then(_(@parse).bind(@)).then(_(@set).bind(@))

    save: (options = {}) ->
      opts = _.extend({}, options)

      _(opts).defaults
        method: if @isNew() then 'POST' else 'PUT'
        url: _.result(@, 'url')
        data: @toJSON()
      $http(opts).then(_(@parse).bind(@)).then(_(@set).bind(@))

    destroy: (opts = {}) ->
      if @collection then @collection.remove(@)
      destroy = () =>
        @trigger('destroy', @, @collection, opts)
        @_eventBus.$destroy()

      if @isNew() then destroy()
      else
        _(opts).defaults
          method: 'DELETE'
          url: @url('delete')
        $http(opts).then(_(@parse).bind(@)).then(destroy)

  # From Backbone source: https://github.com/jashkenas/backbone/blob/master/backbone.js#L571
  # Underscore methods that we want to implement on the Model.
  modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit']

  # Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each modelMethods, (method) ->
    BaseModel::[method] = (args...) ->
      args.unshift @attributes
      _[method].apply(_, args)

  return BaseModel
]
