(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable no-return-assign */
/* global _ */

exports.default = ['$http', 'BaseModel', function ($http, BaseModel) {
  var BaseCollection = function () {
    function BaseCollection(models, opts) {
      _classCallCheck(this, BaseCollection);

      this.currentlyFetching = false;
      this.opts = opts;

      if (this.opts) {
        if (this.opts.model) {
          this.model = this.opts.model;
        }
        if (this.opts.url) {
          this.url = this.opts.url;
        }
        if (this.opts.sort) {
          this.sort = this.opts.sort;
        }
        if (this.opts.comparator) {
          this.comparator = this.opts.comparator;
        }
        if (this.opts.parse && typeof this.opts.parse === 'function') {
          this.parse = this.opts.parse;
          delete this.opts.parse;
        }
      }

      this.models = [];
      this.length = 0;
      this.add(models, this.opts);
    }

    _createClass(BaseCollection, [{
      key: 'url',
      value: function url() {}
    }, {
      key: 'parse',
      value: function parse(res) {
        return res.data;
      }
    }, {
      key: 'fetch',
      value: function fetch(options) {
        var _this = this;

        var defaults = {
          merge: true,
          parse: true,
          method: 'GET',
          url: _(this).result('url')
        };

        options = _.extend(defaults, options);
        if (options.params) {
          options.params = _.extend({}, options.params);
        }
        if (options.data) {
          options.data = _.extend({}, options.data);
        }

        this.currentlyFetching = true;
        var req = $http(options).then(function (models) {
          if (options.reset) {
            _this.reset();
          }
          _this.add(models, options);
          return _this;
        });

        req.finally(function () {
          return _this.currentlyFetching = false;
        });

        return req;
      }
    }, {
      key: 'eq',
      value: function eq(index) {
        if (this.models) {
          return this.models[index];
        }
      }
    }, {
      key: 'get',
      value: function get(id) {
        return _(this.models).findWhere({ id: id });
      }
    }, {
      key: 'remove',
      value: function remove(models) {
        var _this2 = this;

        var isSingular = !_(models).isArray();
        if (isSingular) {
          models = [models];
        }
        var removed = [];

        _(models).forEach(function (model) {
          var index = _this2.indexOf(model);
          if (index === -1) {
            return;
          }
          removed.push(model);
          _this2.models.splice(index, 1);
          return _this2.length--;
        });

        if (isSingular) {
          return removed[0];
        } else {
          return removed;
        }
      }
    }, {
      key: 'add',
      value: function add(models, options) {
        var _this3 = this;

        options = _.extend({ sort: true }, options);

        if (options.parse) {
          models = this.parse(models);
        }
        if (!models) {
          return;
        }

        var isSingular = !_(models).isArray();
        models = isSingular ? [models] : models.slice();
        var added = [];
        var insertAt = typeof options.at === 'undefined' ? this.length : options.at;

        models.forEach(function (model) {
          model = _this3._prepareModel(model, options);

          // Add this model unless we already have it in the collection
          var colModel = _this3.get(model.id);
          if (colModel == null) {
            added.push(model);
            _this3.length++;
            _this3.models.splice(insertAt, 0, model);
            return insertAt++;
          } else if (options.merge) {
            return colModel.set(model.attributes, options);
          }
        });

        if (options.sort) {
          this.sort();
        }

        return isSingular ? added[0] : added;
      }
    }, {
      key: 'create',
      value: function create(attrs, opts) {
        var instance = this.add(attrs, opts);
        if (instance) {
          return instance.save();
        }
      }
    }, {
      key: 'clone',
      value: function clone() {
        return new this.constructor(this.toJSON(), this.opts);
      }
    }, {
      key: 'toJSON',
      value: function toJSON() {
        return _.map(this.models, function (model) {
          return model.toJSON();
        });
      }
    }, {
      key: 'reset',
      value: function reset() {
        this.models = [];
        this.length = 0;
        return this;
      }
    }, {
      key: 'sort',
      value: function sort() {
        if (this.comparator) {
          return this.models.sort(this.comparator);
        }
      }
    }, {
      key: '_prepareModel',
      value: function _prepareModel(attrs, options) {
        var model = void 0;
        options = _.extend({ collection: this }, options);
        if (attrs instanceof this.model || attrs instanceof BaseCollection) {
          model = attrs;
          model.collection = this;
        } else {
          /* eslint-disable new-cap */
          model = new this.model(attrs, options);
          /* eslint-enable new-cap */
        }
        return model;
      }
    }, {
      key: 'pluck',
      value: function pluck(attr) {
        return _.invoke(this.models, 'get', attr);
      }
    }, {
      key: 'where',
      value: function where(attrs, first) {
        if (!attrs) {
          return first ? undefined : [];
        }

        var method = 'filter';
        if (first) {
          method = 'find';
        }
        return this[method](function (model) {
          for (var key in attrs) {
            if (attrs[key] !== model.get(key)) {
              return false;
            }
          }
          return true;
        });
      }
    }, {
      key: 'findWhere',
      value: function findWhere(attrs) {
        return this.where(attrs, true);
      }
    }]);

    return BaseCollection;
  }();

  BaseCollection.prototype.model = BaseModel;

  // From the Backbone source: https://github.com/jashkenas/backbone/blob/master/backbone.js#L942
  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl', 'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke', 'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest', 'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle', 'lastIndexOf', 'isEmpty', 'chain'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function (method) {
    return BaseCollection.prototype[method] = function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function (method) {
    return BaseCollection.prototype[method] = function (value, context) {
      var iterator = _.isFunction(value) ? value : function (model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  return BaseCollection;
}];

},{}],2:[function(_dereq_,module,exports){
'use strict';

var _collection = _dereq_('./collection.js');

var _collection2 = _interopRequireDefault(_collection);

var _model = _dereq_('./model.js');

var _model2 = _interopRequireDefault(_model);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global angular */
angular.module('fs.collections', []).factory('BaseCollection', _collection2.default).factory('BaseModel', _model2.default);

},{"./collection.js":1,"./model.js":3}],3:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable no-return-assign */
/* global _ */
exports.default = ['$http', '$rootScope', function ($http, $rootScope) {
  var BaseModel = function () {
    _createClass(BaseModel, [{
      key: 'parse',
      value: function parse(res) {
        if (res.status && res.headers) {
          return res.data;
        } else {
          return res;
        }
      }
    }, {
      key: '_hasIdAttribute',
      value: function _hasIdAttribute(attrs) {
        return _(Object.keys(attrs)).contains(this.idAttribute);
      }
    }]);

    function BaseModel() {
      var _this = this;

      var attrs = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
      var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _classCallCheck(this, BaseModel);

      this.urlRoot = '';
      this.idAttribute = 'id';
      if (opts.parse) {
        attrs = this.parse(attrs);
      }
      this._eventBus = $rootScope.$new();
      this._eventBus.destuctors = {};
      this._eventBus.$on('$destroy', function () {
        return _(_this._eventBus.destuctors).each(function (callbacks, event) {
          return callbacks.forEach(function (obj) {
            return obj.unwatch();
          });
        });
      });

      if (opts.collection) {
        this.collection = opts.collection;
      }
      if (opts.urlRoot) {
        this.urlRoot = opts.urlRoot;
      }
      if (opts.idAttribute) {
        this.idAttribute = opts.idAttribute;
      }
      if (opts.defaults) {
        this.defaults = opts.defaults;
      }

      this.attributes = {};
      attrs = _.extend({}, attrs);
      attrs = _.defaults(attrs, _.result(this, 'defaults'));
      this.set(attrs);
    }

    _createClass(BaseModel, [{
      key: 'trigger',
      value: function trigger() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return this._eventBus.$broadcast.apply(this._eventBus, args);
      }

      // Wrap the bound callback to strip off the `scope` arg, as we don't want to
      // expose that publicly

    }, {
      key: 'on',
      value: function on(event, cb) {
        if (!this._eventBus.destuctors[event]) {
          this._eventBus.destuctors[event] = [];
        }
        var queue = this._eventBus.destuctors[event];
        var wrapped = function wrapped(scope, e) {
          for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
            args[_key2 - 2] = arguments[_key2];
          }

          return cb.apply(this, [e].concat(args));
        };

        return queue.push({
          unwatch: this._eventBus.$on(event, wrapped),
          original: cb
        });
      }
    }, {
      key: 'off',
      value: function off(event, cb) {
        var callbacks = this._eventBus.destuctors[event] || [];
        var matches = [];

        if (cb) {
          matches = callbacks.filter(function (obj) {
            return obj.original === cb;
          });
        } else {
          matches = callbacks;
        }

        return matches.forEach(function (obj) {
          return obj.unwatch();
        });
      }
    }, {
      key: 'once',
      value: function once(event, cb) {
        var _this2 = this;

        var wrapped = function wrapped() {
          for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            args[_key3] = arguments[_key3];
          }

          _this2.off(event, wrapped);
          return cb.apply(_this2, args);
        };

        return this.on(event, wrapped);
      }
    }, {
      key: 'has',
      value: function has(key) {
        return this.attributes[key] != null;
      }
    }, {
      key: 'get',
      value: function get(key) {
        return this.attributes[key];
      }
    }, {
      key: 'set',
      value: function set(key, val) {
        var _this3 = this;

        var attrs = void 0;
        if (!key) {
          return this;
        }

        if ((typeof key === 'undefined' ? 'undefined' : _typeof(key)) === 'object') {
          attrs = key;
        } else {
          attrs = {};
          attrs[key] = val;
        }

        var changed = {};

        if (this._hasIdAttribute(attrs)) {
          this.id = attrs[this.idAttribute];
        }

        _(attrs).each(function (aVal, aKey) {
          if (_this3.attributes[aKey] !== aVal) {
            changed[aKey] = aVal;
          }
          return _this3.attributes[aKey] = aVal;
        });

        this.trigger('change', this, changed);
        _(changed).each(function (val, key) {
          return _this3.trigger('change:' + key, _this3, val);
        });

        return this;
      }
    }, {
      key: 'isNew',
      value: function isNew() {
        if (this.id != null) {
          return false;
        } else {
          return true;
        }
      }
    }, {
      key: 'url',
      value: function url() {
        var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url');
        if (this.isNew()) {
          return base;
        } else {
          var id = encodeURIComponent(this.id);
          return base + (base.charAt(base.length - 1) === '/' ? id : '/' + id);
        }
      }
    }, {
      key: 'toJSON',
      value: function toJSON() {
        return _.clone(this.attributes);
      }
    }, {
      key: 'fetch',
      value: function fetch() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var opts = _.extend({}, options);

        _(opts).defaults({
          method: 'GET',
          url: _.result(this, 'url')
        });
        return $http(opts).then(_(this.parse).bind(this)).then(_(this.set).bind(this));
      }
    }, {
      key: 'save',
      value: function save() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var opts = _.extend({}, options);

        _(opts).defaults({
          method: this.isNew() ? 'POST' : 'PUT',
          url: _.result(this, 'url'),
          data: this.toJSON()
        });
        return $http(opts).then(_(this.parse).bind(this)).then(_(this.set).bind(this));
      }
    }, {
      key: 'destroy',
      value: function destroy() {
        var _this4 = this;

        var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        if (this.collection) {
          this.collection.remove(this);
        }
        var destroy = function destroy() {
          _this4.trigger('destroy', _this4, _this4.collection, opts);
          return _this4._eventBus.$destroy();
        };

        if (this.isNew()) {
          return destroy();
        } else {
          _(opts).defaults({
            method: 'DELETE',
            url: this.url('delete')
          });
          return $http(opts).then(_(this.parse).bind(this)).then(destroy);
        }
      }
    }]);

    return BaseModel;
  }();

  // From Backbone source: https://github.com/jashkenas/backbone/blob/master/backbone.js#L571
  // Underscore methods that we want to implement on the Model.


  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function (method) {
    return BaseModel.prototype[method] = function () {
      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  return BaseModel;
}];

},{}]},{},[2])


//# sourceMappingURL=index.js.map
