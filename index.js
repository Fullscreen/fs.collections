(function() {
  angular.module('fs.collections', []);

}).call(this);

(function() {
  var app,
    slice = [].slice;

  app = angular.module('fs.collections');

  app.factory('BaseCollection', [
    '$http', 'BaseModel', function($http, BaseModel) {
      var BaseCollection, attributeMethods, methods;
      BaseCollection = (function() {
        BaseCollection.prototype.model = BaseModel;

        BaseCollection.prototype.currentlyFetching = false;

        function BaseCollection(models, opts1) {
          this.opts = opts1;
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

        BaseCollection.prototype.url = function() {};

        BaseCollection.prototype.parse = function(res) {
          return res.data;
        };

        BaseCollection.prototype.fetch = function(options) {
          var defaults, req;
          defaults = {
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
          req = $http(options).then((function(_this) {
            return function(models) {
              if (options.reset) {
                _this.reset();
              }
              _this.add(models, options);
              return _this;
            };
          })(this));
          req["finally"]((function(_this) {
            return function() {
              return _this.currentlyFetching = false;
            };
          })(this));
          return req;
        };

        BaseCollection.prototype.eq = function(index) {
          var ref;
          return (ref = this.models) != null ? ref[index] : void 0;
        };

        BaseCollection.prototype.get = function(id) {
          return _(this.models).findWhere({
            id: id
          });
        };

        BaseCollection.prototype.remove = function(models) {
          var isSingular, removed;
          isSingular = !_(models).isArray();
          if (isSingular) {
            models = [models];
          }
          removed = [];
          _(models).forEach((function(_this) {
            return function(model) {
              var index;
              index = _this.indexOf(model);
              if (index === -1) {
                return;
              }
              removed.push(model);
              _this.models.splice(index, 1);
              return _this.length--;
            };
          })(this));
          if (isSingular) {
            return removed[0];
          } else {
            return removed;
          }
        };

        BaseCollection.prototype.add = function(models, options) {
          var added, insertAt, isSingular;
          options = _.extend({
            sort: true
          }, options);
          if (options.parse) {
            models = this.parse(models);
          }
          if (!models) {
            return;
          }
          isSingular = !_(models).isArray();
          models = isSingular ? [models] : models.slice();
          added = [];
          insertAt = typeof options.at === 'undefined' ? this.length : options.at;
          models.forEach((function(_this) {
            return function(model) {
              var colModel;
              model = _this._prepareModel(model, options);
              colModel = _this.get(model.id);
              if (colModel == null) {
                added.push(model);
                _this.length++;
                _this.models.splice(insertAt, 0, model);
                return insertAt++;
              } else if (options.merge) {
                return colModel.set(model.attributes);
              }
            };
          })(this));
          if (options.sort) {
            this.sort();
          }
          if (isSingular) {
            return added[0];
          } else {
            return added;
          }
        };

        BaseCollection.prototype.create = function(attrs, opts) {
          var instance;
          instance = this.add(attrs, opts);
          if (instance) {
            return instance.save();
          }
        };

        BaseCollection.prototype.clone = function() {
          return new this.constructor(this.toJSON(), this.opts);
        };

        BaseCollection.prototype.toJSON = function() {
          return _.map(this.models, function(model) {
            return model.toJSON();
          });
        };

        BaseCollection.prototype.reset = function() {
          this.models = [];
          this.length = 0;
          return this;
        };

        BaseCollection.prototype.sort = function() {
          if (this.comparator) {
            return this.models.sort(this.comparator);
          }
        };

        BaseCollection.prototype._prepareModel = function(attrs, options) {
          var model;
          options = _.extend({
            collection: this
          }, options);
          if (attrs instanceof this.model) {
            model = attrs;
            model.collection = this;
          } else {
            model = new this.model(attrs, options);
          }
          return model;
        };

        BaseCollection.prototype.pluck = function(attr) {
          return _.invoke(this.models, 'get', attr);
        };

        BaseCollection.prototype.where = function(attrs, first) {
          if (!attrs) {
            if (first) {
              return void 0;
            } else {
              return [];
            }
          }
          return this[first ? 'find' : 'filter'](function(model) {
            var key, value;
            for (key in attrs) {
              value = attrs[key];
              if (attrs[key] !== model.get(key)) {
                return false;
              }
            }
            return true;
          });
        };

        BaseCollection.prototype.findWhere = function(attrs) {
          return this.where(attrs, true);
        };

        return BaseCollection;

      })();
      methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl', 'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke', 'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest', 'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle', 'lastIndexOf', 'isEmpty', 'chain'];
      _.each(methods, function(method) {
        return BaseCollection.prototype[method] = function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          args.unshift(this.models);
          return _[method].apply(_, args);
        };
      });
      attributeMethods = ['groupBy', 'countBy', 'sortBy'];
      _.each(attributeMethods, function(method) {
        return BaseCollection.prototype[method] = function(value, context) {
          var iterator;
          iterator = _.isFunction(value) ? value : function(model) {
            return model.get(value);
          };
          return _[method](this.models, iterator, context);
        };
      });
      return BaseCollection;
    }
  ]);

}).call(this);

(function() {
  var app,
    slice = [].slice;

  app = angular.module('fs.collections');

  app.factory('BaseModel', [
    '$http', '$rootScope', function($http, $rootScope) {
      var BaseModel, modelMethods;
      BaseModel = (function() {
        BaseModel.prototype.parse = function(res) {
          if (res.status && res.headers) {
            return res.data;
          } else {
            return res;
          }
        };

        BaseModel.prototype._hasIdAttribute = function(attrs) {
          return _(Object.keys(attrs)).contains(this.idAttribute);
        };

        function BaseModel(attrs, opts) {
          if (attrs == null) {
            attrs = {};
          }
          if (opts == null) {
            opts = {};
          }
          if (opts.parse) {
            attrs = this.parse(attrs);
          }
          this._eventBus = $rootScope.$new();
          this._eventBus.destuctors = {};
          this._eventBus.$on('$destroy', (function(_this) {
            return function() {
              return _(_this._eventBus.destuctors).each(function(callbacks, event) {
                return callbacks.forEach(function(obj) {
                  return obj.unwatch();
                });
              });
            };
          })(this));
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

        BaseModel.prototype.trigger = function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return this._eventBus.$broadcast.apply(this._eventBus, args);
        };

        BaseModel.prototype.on = function(event, cb) {
          var queue, wrapped;
          if (!this._eventBus.destuctors[event]) {
            this._eventBus.destuctors[event] = [];
          }
          queue = this._eventBus.destuctors[event];
          wrapped = function() {
            var args, e, scope;
            scope = arguments[0], e = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
            return cb.apply(this, [e].concat(args));
          };
          return queue.push({
            unwatch: this._eventBus.$on(event, wrapped),
            original: cb
          });
        };

        BaseModel.prototype.off = function(event, cb) {
          var callbacks, matches;
          callbacks = this._eventBus.destuctors[event] || [];
          matches = [];
          if (cb) {
            matches = callbacks.filter(function(obj) {
              return obj.original === cb;
            });
          } else {
            matches = callbacks;
          }
          return matches.forEach(function(obj) {
            return obj.unwatch();
          });
        };

        BaseModel.prototype.once = function(event, cb) {
          var wrapped;
          wrapped = (function(_this) {
            return function() {
              var args;
              args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
              _this.off(event, wrapped);
              return cb.apply(_this, args);
            };
          })(this);
          return this.on(event, wrapped);
        };

        BaseModel.prototype.has = function(key) {
          return this.attributes[key] != null;
        };

        BaseModel.prototype.get = function(key) {
          return this.attributes[key];
        };

        BaseModel.prototype.set = function(key, val) {
          var attrs, changed;
          if (!key) {
            return this;
          }
          if (typeof key === 'object') {
            attrs = key;
          } else {
            attrs = {};
            attrs[key] = val;
          }
          changed = {};
          if (this._hasIdAttribute(attrs)) {
            this.id = attrs[this.idAttribute];
          }
          _(attrs).each((function(_this) {
            return function(aVal, aKey) {
              if (_this.attributes[aKey] !== aVal) {
                changed[aKey] = aVal;
              }
              return _this.attributes[aKey] = aVal;
            };
          })(this));
          this.trigger('change', this, changed);
          _(changed).each((function(_this) {
            return function(val, key) {
              return _this.trigger("change:" + key, _this, val);
            };
          })(this));
          return this;
        };

        BaseModel.prototype.urlRoot = '';

        BaseModel.prototype.idAttribute = 'id';

        BaseModel.prototype.isNew = function() {
          if (this.id != null) {
            return false;
          } else {
            return true;
          }
        };

        BaseModel.prototype.url = function() {
          var base, id;
          base = _.result(this, 'urlRoot') || _.result(this.collection, 'url');
          if (this.isNew()) {
            return base;
          } else {
            id = encodeURIComponent(this.id);
            return base + (base.charAt(base.length - 1) === '/' ? id : '/' + id);
          }
        };

        BaseModel.prototype.toJSON = function() {
          return _.clone(this.attributes);
        };

        BaseModel.prototype.fetch = function(options) {
          var opts;
          if (options == null) {
            options = {};
          }
          opts = _.extend({}, options);
          _(opts).defaults({
            method: 'GET',
            url: _.result(this, 'url')
          });
          return $http(opts).then(_(this.parse).bind(this)).then(_(this.set).bind(this));
        };

        BaseModel.prototype.save = function(options) {
          var opts;
          if (options == null) {
            options = {};
          }
          opts = _.extend({}, options);
          _(opts).defaults({
            method: this.isNew() ? 'POST' : 'PUT',
            url: _.result(this, 'url'),
            data: this.toJSON()
          });
          return $http(opts).then(_(this.parse).bind(this)).then(_(this.set).bind(this));
        };

        BaseModel.prototype.destroy = function(opts) {
          var destroy;
          if (opts == null) {
            opts = {};
          }
          if (this.collection) {
            this.collection.remove(this);
          }
          destroy = (function(_this) {
            return function() {
              _this.trigger('destroy', _this, _this.collection, opts);
              return _this._eventBus.$destroy();
            };
          })(this);
          if (this.isNew()) {
            return destroy();
          } else {
            _(opts).defaults({
              method: 'DELETE',
              url: this.url('delete')
            });
            return $http(opts).then(_(this.parse).bind(this)).then(destroy);
          }
        };

        return BaseModel;

      })();
      modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];
      _.each(modelMethods, function(method) {
        return BaseModel.prototype[method] = function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          args.unshift(this.attributes);
          return _[method].apply(_, args);
        };
      });
      return BaseModel;
    }
  ]);

}).call(this);
