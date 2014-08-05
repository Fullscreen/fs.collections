app = angular.module('fs.collections')

app.factory 'PaginationCollection', (BaseCollection, BaseModel, $q) ->
  class PaginationCollection extends BaseCollection
    constructor: (models, options) ->
      defaults =
        exhausted: false
        limit: 10
        token: null

      options = _.extend({}, options)
      options.pagination = _.extend(defaults, options.pagination)

      super models, options

    parse: (res) ->
      items = res.data

      if items?.length then @pagination.token = _(items).last().pagination_token
      else                 @pagination.exhausted = true

      super res

    reset: ->
      super
      @pagination.exhausted = false
      @pagination.token = null
      @

    canFetch: -> @pagination.exhausted is false and @currentlyFetching is false

    nextPage: (options) ->
      options = _.extend({}, options)
      defaults = {}

      # Set up our pagination params
      if @pagination.token
        defaults.page_token = @pagination.token
      else
        defaults.offset = @length
        defaults.limit = @pagination.limit

      # Merge pagination params into passed params
      options.params = _.extend(defaults, options.params)

      request = @fetch(options)

      # Mark the collection as exhausted to prevent further fetching
      request.catch (res) =>
        @pagination.exhausted = true
        $q.reject(res)

      return request

