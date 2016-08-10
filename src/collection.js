/* eslint-disable no-return-assign */
/* global _ */

export default ['$http', 'BaseModel', function ($http, BaseModel) {
  class BaseCollection {
    constructor (models, opts) {
      this.currentlyFetching = false
      this.opts = opts

      if (this.opts) {
        if (this.opts.model) { this.model = this.opts.model }
        if (this.opts.url) { this.url = this.opts.url }
        if (this.opts.sort) { this.sort = this.opts.sort }
        if (this.opts.comparator) { this.comparator = this.opts.comparator }
        if (this.opts.parse && typeof this.opts.parse === 'function') {
          this.parse = this.opts.parse
          delete this.opts.parse
        }
      }

      this.models = []
      this.length = 0
      this.add(models, this.opts)
    }

    url () {}

    parse (res) { return res.data }

    fetch (options) {
      let defaults = {
        merge: true,
        parse: true,
        method: 'GET',
        url: _(this).result('url')
      }

      options = _.extend(defaults, options)
      if (options.params) { options.params = _.extend({}, options.params) }
      if (options.data) { options.data = _.extend({}, options.data) }

      this.currentlyFetching = true
      let req = $http(options).then(models => {
        if (options.reset) { this.reset() }
        this.add(models, options)
        return this
      })

      req.finally(() => this.currentlyFetching = false)

      return req
    }

    eq (index) {
      if (this.models) {
        return this.models[index]
      }
    }

    get (id) {
      return _(this.models).findWhere({id})
    }

    remove (models) {
      let isSingular = !_(models).isArray()
      if (isSingular) { models = [models] }
      let removed = []

      _(models).forEach(model => {
        let index = this.indexOf(model)
        if (index === -1) { return }
        removed.push(model)
        this.models.splice(index, 1)
        return this.length--
      })

      if (isSingular) { return removed[0] } else { return removed }
    }

    add (models, options) {
      options = _.extend({sort: true}, options)

      if (options.parse) { models = this.parse(models) }
      if (!models) { return }

      let isSingular = !_(models).isArray()
      models = isSingular ? [models] : models.slice()
      let added = []
      let insertAt = typeof options.at === 'undefined' ? this.length : options.at

      models.forEach(model => {
        model = this._prepareModel(model, options)

        // Add this model unless we already have it in the collection
        let colModel = this.get(model.id)
        if (colModel == null) {
          added.push(model)
          this.length++
          this.models.splice(insertAt, 0, model)
          return insertAt++
        } else if (options.merge) {
          return colModel.set(model.attributes, options)
        }
      })

      if (options.sort) { this.sort() }

      return isSingular ? added[0] : added
    }

    create (attrs, opts) {
      let instance = this.add(attrs, opts)
      if (instance) { return instance.save() }
    }

    clone () {
      return new this.constructor(this.toJSON(), this.opts)
    }

    toJSON () {
      return _.map(this.models, model => model.toJSON()
      )
    }

    reset () {
      this.models = []
      this.length = 0
      return this
    }

    sort () {
      if (this.comparator) { return this.models.sort(this.comparator) }
    }

    _prepareModel (attrs, options) {
      let model
      options = _.extend({collection: this}, options)
      if (attrs instanceof this.model || attrs instanceof BaseCollection) {
        model = attrs
        model.collection = this
      } else {
        /* eslint-disable new-cap */
        model = new this.model(attrs, options)
        /* eslint-enable new-cap */
      }
      return model
    }

    pluck (attr) {
      return _.invoke(this.models, 'get', attr)
    }

    where (attrs, first) {
      if (!attrs) {
        return first ? undefined : []
      }

      let method = 'filter'
      if (first) {
        method = 'find'
      }
      return this[method](function (model) {
        for (let key in attrs) {
          if (attrs[key] !== model.get(key)) { return false }
        }
        return true
      })
    }

    findWhere (attrs) {
      return this.where(attrs, true)
    }
  }

  BaseCollection.prototype.model = BaseModel

  // From the Backbone source: https://github.com/jashkenas/backbone/blob/master/backbone.js#L942
  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  let methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain']

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, method =>
    BaseCollection.prototype[method] = function (...args) {
      args.unshift(this.models)
      return _[method].apply(_, args)
    }

  )

  // Underscore methods that take a property name as an argument.
  let attributeMethods = ['groupBy', 'countBy', 'sortBy']

  // Use attributes instead of properties.
  _.each(attributeMethods, method =>
    BaseCollection.prototype[method] = function (value, context) {
      let iterator = _.isFunction(value) ? value : model => model.get(value)
      return _[method](this.models, iterator, context)
    }

  )

  return BaseCollection
}]
