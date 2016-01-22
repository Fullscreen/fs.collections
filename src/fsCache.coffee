# Considering using fscache? first see if you can simply put a cache header
# on your api.
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
      cacheDefault = $cacheFactory('fs.collections')

    # straight from angular
    # https://github.com/angular/angular.js/blob/fce07f5/src/ng/http.js#L1304
  buildURL = (url, serializedParams) ->
    if (serializedParams.length > 0)
      url += (if (url.indexOf('?') == -1) then '?' else '&') + serializedParams;
    return url

  _buildCacheKey = (options) ->
    buildURL(options.url, options.paramSerializer(options.params))

  @_buildCacheKey = _buildCacheKey

  return class fsCache
    cacheTimeout: null
    cache: cacheDefault
    cacheTTL: cacheTTL
    _buildCacheKey: _buildCacheKey

    scheduleCacheTimeout: (options) ->
      if options && options.cache && options.url
        @cacheTimeout = $timeout((() => @cache.remove(@_buildCacheKey(options))), options.cacheTTL)

  ]
  return @
)
