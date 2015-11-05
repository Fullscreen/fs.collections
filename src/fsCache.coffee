angular.module('fs.collections').provider('fsCache', () ->
  cacheEnabled = false
  cacheTTL = 60000
  @setCacheTTL = (ttl) ->
    cacheTTL = ttl
  @setCacheEnabled = (isCacheEnabled) ->
    cacheEnabled = isCacheEnabled
  @$get = ['$http', '$cacheFactory', '$timeout', ($http, $cacheFactory, $timeout) ->
    cacheDefault = false
    if cacheEnabled
      cacheDefault = $cacheFactory.get('fs.collections')

    # straight from angular
    # https://github.com/angular/angular.js/blob/fce07f5/src/ng/http.js#L1304
    buildURL = (url, serializedParams) ->
      if (serializedParams.length > 0)
        url += ((url.indexOf('?') == -1) ? '?' : '&') + serializedParams;
      return url

    return class fsCache
      cacheTimeout: null
      cache: cacheDefault
      cacheTTL: cacheTTL
      bustCache: (key) ->
        if angular.isString(key)
          @cache.remove(key)
        else if angular.isObject(key) && key.url && key.params
          @cache.remove(buildURL(key.url, $http.paramSerializer(key.params)))
      scheduleCacheTimeout: (options) ->
          @cacheTimeout = $timeout((() => @bustCache(options)), options.cacheTTL)

  ]
  return @
)
