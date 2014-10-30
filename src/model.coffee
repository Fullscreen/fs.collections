app = angular.module('fs.collections')

app.factory 'BaseModel', ($http, $rootScope) ->
  class BaseModel
    parse: (res) -> res.data

    _hasIdAttribute: (attrs) ->
      _(Object.keys(attrs)).contains(@idAttribute)

    constructor: (attrs = {}, opts = {}) ->
      @_eventBus = $rootScope.$new()
      @_eventBus.destuctors = []
      @_eventBus.$on 'destroy', => @_eventBus.destuctors.forEach (fn) -> fn()

      @[key] = value for key, value of opts
      @attributes = {}
      attrs = _.extend({}, attrs)
      attrs = _.defaults(attrs, _.result(@, 'defaults'))
      @set(attrs)

    trigger: (args...) -> @_eventBus.$broadcast.apply(@_eventBus, args)

    # Wrap the bound callback to strip off the `scope` arg, as we don't want to
    # expose that publicly
    on: (event, cb) ->
      @_eventBus.destuctors.push @_eventBus.$on event, (scope, e, args...) ->
        cb.apply(@, [e].concat(args))

    has: (key) -> @attributes[key]?

    get: (key) -> @attributes[key]

    set: (key, val) ->
      unless key then return @

      if typeof key is 'object'
        attrs = key
      else
        attrs = {}
        attrs[key] = val

      @id = attrs[@idAttribute] if @_hasIdAttribute(attrs)
      @attributes[aKey] = aVal for aKey, aVal of attrs
      @trigger('change', @, attrs)
      _(attrs).each (val, key) => @trigger("change:#{key}", @, val)
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
      unless @isNew()
        _(opts).defaults
          method: 'DELETE'
          url: @url('delete')
        $http(opts).then(_(@parse).bind(@))

  # From Backbone source: https://github.com/jashkenas/backbone/blob/master/backbone.js#L571
  # Underscore methods that we want to implement on the Model.
  modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit']

  # Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each modelMethods, (method) ->
    BaseModel::[method] = (args...) ->
      args.unshift @attributes
      _[method].apply(_, args)

  return BaseModel
