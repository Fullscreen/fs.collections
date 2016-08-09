/* eslint-disable no-return-assign */
/* global _ */
export default ['$http', '$rootScope', function ($http, $rootScope) {
  class BaseModel {
    parse (res) {
      if (res.status && res.headers) {
        return res.data
      } else {
        return res
      }
    }

    _hasIdAttribute (attrs) {
      return _(Object.keys(attrs)).contains(this.idAttribute)
    }

    constructor (attrs = {}, opts = {}) {
      this.urlRoot = ''
      this.idAttribute = 'id'
      if (opts.parse) { attrs = this.parse(attrs) }
      this._eventBus = $rootScope.$new()
      this._eventBus.destuctors = {}
      this._eventBus.$on('$destroy', () => {
        return _(this._eventBus.destuctors).each((callbacks, event) => callbacks.forEach(obj => obj.unwatch()))
      })

      if (opts.collection) { this.collection = opts.collection }
      if (opts.urlRoot) { this.urlRoot = opts.urlRoot }
      if (opts.idAttribute) { this.idAttribute = opts.idAttribute }
      if (opts.defaults) { this.defaults = opts.defaults }

      this.attributes = {}
      attrs = _.extend({}, attrs)
      attrs = _.defaults(attrs, _.result(this, 'defaults'))
      this.set(attrs)
    }

    trigger (...args) { return this._eventBus.$broadcast.apply(this._eventBus, args) }

    // Wrap the bound callback to strip off the `scope` arg, as we don't want to
    // expose that publicly
    on (event, cb) {
      if (!this._eventBus.destuctors[event]) { this._eventBus.destuctors[event] = [] }
      let queue = this._eventBus.destuctors[event]
      let wrapped = function (scope, e, ...args) { return cb.apply(this, [e].concat(args)) }

      return queue.push({
        unwatch: this._eventBus.$on(event, wrapped),
        original: cb
      })
    }

    off (event, cb) {
      let callbacks = this._eventBus.destuctors[event] || []
      let matches = []

      if (cb) {
        matches = callbacks.filter(obj => obj.original === cb)
      } else {
        matches = callbacks
      }

      return matches.forEach(obj => obj.unwatch())
    }

    once (event, cb) {
      let wrapped = (...args) => {
        this.off(event, wrapped)
        return cb.apply(this, args)
      }

      return this.on(event, wrapped)
    }

    has (key) { return (this.attributes[key] != null) }

    get (key) { return this.attributes[key] }

    set (key, val) {
      let attrs
      if (!key) { return this }

      if (typeof key === 'object') {
        attrs = key
      } else {
        attrs = {}
        attrs[key] = val
      }

      let changed = {}

      if (this._hasIdAttribute(attrs)) { this.id = attrs[this.idAttribute] }

      _(attrs).each((aVal, aKey) => {
        if (this.attributes[aKey] !== aVal) { changed[aKey] = aVal }
        return this.attributes[aKey] = aVal
      })

      this.trigger('change', this, changed)
      _(changed).each((val, key) => this.trigger(`change:${key}`, this, val))

      return this
    }

    isNew () { if (this.id != null) { return false } else { return true } }

    url () {
      let base = _.result(this, 'urlRoot') || _.result(this.collection, 'url')
      if (this.isNew()) {
        return base
      } else {
        let id = encodeURIComponent(this.id)
        return base + (base.charAt(base.length - 1) === '/' ? id : `/${id}`)
      }
    }

    toJSON () {
      return _.clone(this.attributes)
    }

    fetch (options = {}) {
      let opts = _.extend({}, options)

      _(opts).defaults({
        method: 'GET',
        url: _.result(this, 'url')
      })
      return $http(opts).then(_(this.parse).bind(this)).then(_(this.set).bind(this))
    }

    save (options = {}) {
      let opts = _.extend({}, options)

      _(opts).defaults({
        method: this.isNew() ? 'POST' : 'PUT',
        url: _.result(this, 'url'),
        data: this.toJSON()
      })
      return $http(opts).then(_(this.parse).bind(this)).then(_(this.set).bind(this))
    }

    destroy (opts = {}) {
      if (this.collection) { this.collection.remove(this) }
      let destroy = () => {
        this.trigger('destroy', this, this.collection, opts)
        return this._eventBus.$destroy()
      }

      if (this.isNew()) {
        return destroy()
      } else {
        _(opts).defaults({
          method: 'DELETE',
          url: this.url('delete')
        })
        return $http(opts).then(_(this.parse).bind(this)).then(destroy)
      }
    }
  }

  // From Backbone source: https://github.com/jashkenas/backbone/blob/master/backbone.js#L571
  // Underscore methods that we want to implement on the Model.
  let modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit']

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, method =>
    BaseModel.prototype[method] = function (...args) {
      args.unshift(this.attributes)
      return _[method].apply(_, args)
    }
  )

  return BaseModel
}]
