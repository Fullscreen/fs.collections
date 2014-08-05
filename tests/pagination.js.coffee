describe "The dependable PaginationCollection", ->
  Collection = undefined
  backend = undefined

  beforeEach ->
    module('fs.collections')
    inject (PaginationCollection, $httpBackend) ->
      Collection = PaginationCollection
      backend = $httpBackend

  it "should use default pagination options when fetching", ->
    instance = new Collection([], url: 'http://google.com')
    backend.expectGET('http://google.com?limit=10&offset=0').respond 200, {id: 1}

    instance.nextPage()
    backend.flush()

    expect(instance.first().id).toBe(1)

  it "should allow setting custom pagination settings", ->
    backend.expectGET('http://google.com?limit=100&offset=0').respond 200, {id: 1}
    instance = new Collection [],
      url: 'http://google.com'
      pagination: { limit: 100 }

    instance.nextPage()
    backend.flush()

    expect(instance.first().id).toBe(1)

  it "should use its length to calculate its offset", ->
    instance = new Collection [id: 1], url: 'http://google.com'
    backend.expectGET('http://google.com?limit=10&offset=1').respond 200, []

    instance.nextPage()
    backend.flush()

    expect(instance.first().id).toBe(1)

  it "should allow you to override its default settings", ->
    instance = new Collection [id: 1], url: 'http://google.com'
    backend.expectGET('http://google.com?limit=20&offset=10').respond 200, []
    options = {params: { limit: 20, offset: 10 }}

    instance.nextPage(options)
    backend.flush()

  it "shouldn't mangle your fetch options", ->
    # Yes this has happened, and yes this is why _.extend is your best friend
    instance = new Collection [id: 1], url: 'http://google.com'
    backend.expectGET('http://google.com?limit=20&offset=1').respond 200, []
    options = {params: { limit: 20 }}

    instance.nextPage(options)
    backend.flush()

    expect(options.offset).toBe(undefined)

  it "should stop parse pagination_tokens from responses", ->
    instance = new Collection [], url: 'http://google.com'
    backend.expectGET('http://google.com?limit=10&offset=0').respond 200, [ {id: 1, pagination_token: 'bacon'} ]

    expect(instance.pagination.token).toBeNull()
    instance.nextPage()
    backend.flush()

    expect(instance.pagination.token).toBe('bacon')

  it "should become tuckered out when it receives an empty response", ->
    instance = new Collection [], url: 'http://google.com'
    backend.expectGET('http://google.com?limit=10&offset=0').respond 200, []

    expect(instance.pagination.exhausted).toBe(false)
    instance.nextPage()
    backend.flush()

    expect(instance.pagination.exhausted).toBe(true)

  it "should become unfetchable when exhausted or busy", ->
    # Helpers to muck up collection state
    makeBusy = (c) -> c.currentlyFetching = true; return c
    makeExhausted = (c) -> c.pagination.exhausted = true; return c

    fresh = new Collection()
    exhausted = makeExhausted(new Collection())
    busy = makeBusy(new Collection())
    exhaustedAndBusy = makeBusy(makeExhausted(new Collection()))

    expect(fresh.canFetch()).toBe(true)
    expect(exhausted.canFetch()).toBe(false)
    expect(busy.canFetch()).toBe(false)
    expect(exhaustedAndBusy.canFetch()).toBe(false)

  it "should unset all pagination tokens when reset", ->
    instance = new Collection([id: 1], url: 'http://google.com')
    instance.pagination.token = 'foo'

    backend.expectGET('http://google.com?page_token=foo').respond 200, [id: 1]
    instance.nextPage()
    backend.flush()

    backend.expectGET('http://google.com?limit=10&offset=0').respond 200, []
    instance.reset()
    instance.nextPage()

    expect(instance.length).toBe(0)
    expect(instance.pagination.token).toBeFalsy()

  it "should become fetchable when reset", ->
    instance = new Collection([id: 1], url: 'http://google.com')
    instance.pagination.exhausted = true
    instance.pagination.token = 'foo'
    backend.expectGET('http://google.com?limit=10&offset=0').respond 200, [id: 1]

    expect(instance.length).toBe(1)
    expect(instance.canFetch()).toBe(false)

    instance.reset()
    instance.nextPage()
    backend.flush()

    expect(instance.length).toBe(1)
    expect(instance.canFetch()).toBe(true)
    expect(instance.pagination.token).toBe(undefined)
