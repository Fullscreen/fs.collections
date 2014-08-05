describe "The dependable BaseCollection", ->
  Collection = undefined
  Model = undefined
  backend = undefined

  class FakeModel
    constructor: (attrs) ->
      @id = attrs.id if attrs.id

      # Spy on the constructor and fetch methods
      @spy = jasmine.createSpy()
      @save = jasmine.createSpy()
      @spy(attrs)

  beforeEach ->
    module('fs.collections')
    inject (BaseCollection, BaseModel, $httpBackend) ->
      Collection = BaseCollection
      Model = BaseModel
      backend = $httpBackend

  it "should create models using the objects you pass it", ->
    instance = new Collection [{id: 1}, {id: 2}, {id: 3}]
    expect(instance.length).toBe(3)
    expect(instance.models[0] instanceof Model).toBe(true)
    expect(instance.models[0].id).toBe(1)

    expect(instance.models[1] instanceof Model).toBe(true)
    expect(instance.models[1].id).toBe(2)

    expect(instance.models[2] instanceof Model).toBe(true)
    expect(instance.models[2].id).toBe(3)

    expect(instance.models[3]).toBeUndefined()

  it "should store options passed to it on the collection", ->
    instance = new Collection [], {url: 'http://google.com'}

    expect(instance.length).toBe(0)
    expect(instance.url).toBe('http://google.com')

  it "should initialize new models using its 'model' attribute", ->
    instance = new Collection [{id: 1}], model: FakeModel
    expect(instance.length).toBe(1)
    expect(instance.models[0] instanceof FakeModel).toBe(true)
    expect(instance.models[0].spy).toHaveBeenCalledWith({id: 1})

  it "should be able to handle being passed both objects and models", ->
    instance = new Collection([{id: 1}, {id: 2}], model: FakeModel)

    expect(instance.length).toBe(2)
    expect(instance.models[0] instanceof FakeModel).toBe(true)
    expect(instance.models[0].spy.callCount).toBe(1)

    expect(instance.models[1] instanceof FakeModel).toBe(true)
    expect(instance.models[1].spy.callCount).toBe(1)

  it "should store a reference to iself on its models", ->
    instance = new Collection [{id: 1}, new Model(id: 2)]
    expect(instance.models[0].collection).toBe(instance)
    expect(instance.models[1].collection).toBe(instance)

  it "should empty its model store when reset", ->
    instance = new Collection [{id: 1}, new Model(id: 2)]
    expect(instance.length).toBe(2)
    expect(instance.models.length).toBe(2)

    instance.reset()

    expect(instance.length).toBe(0)
    expect(instance.models.length).toBe(0)

  it "should let you look up models based on their ID", ->
    a = new Model(id: 1)
    b = new Model(id: 2)
    c = new Model(id: 'foo')
    instance = new Collection [a, b, c]

    expect(instance.get(1)).toBe(a)
    expect(instance.get(2)).toBe(b)
    expect(instance.get('foo')).toBe(c)
    expect(instance.get(3)).toBeUndefined()
    expect(instance.get('3')).toBeUndefined()

  it "should prevent you from adding a model with the same id twice", ->
    instance = new Collection()
    a = new Model(id: 1, bacon: 'canadian')
    b = new Model(id: 2, bacon: 'smoked')
    c = new Model(id: 2, bacon: 'crunchy')

    instance.add([a, b, c])

    expect(instance.length).toBe(2)
    expect(instance.get(2).get('bacon')).toBe('smoked')

  it "should let you add multiple models at once", ->
    instance = new Collection()
    a = new Model(id: 1, bacon: 'canadian')
    b = new Model(id: 2, bacon: 'smoked')
    c = new Model(id: 3, bacon: 'crunchy')

    instance.add([a, b, c])

    expect(instance.length).toBe(3)
    expect(instance.get(2).get('bacon')).toBe('smoked')

  it "should let you add models at a specific index", ->
    instance = new Collection([], sort: ->) #disable sorting to allow this to work
    a = id: 1, bacon: 'canadian'
    b = id: 2, bacon: 'smoked'
    c = id: 3, bacon: 'crunchy'

    instance.add(a)
    instance.add([b, c], at: 0)

    expect(instance.length).toBe(3)
    expect(instance.toJSON()).toEqual([b, c, a])


  it "should pluck attributes from its models", ->
    instance = new Collection()
    a = new Model(id: 1, bacon: 'canadian')
    b = new Model(id: 2, bacon: 'smoked')
    c = new Model(id: 3, bacon: 'crunchy')

    instance.add([a, b, c])
    typesOfBacon = instance.pluck('bacon')

    expect(typesOfBacon).toEqual(['canadian', 'smoked', 'crunchy'])

  it "should pluck the data key from incoming HTTP responses", ->
    instance = new Collection()
    a = new Model()
    b = new Model()

    parsed = instance.parse {headers: 'foo', things: 'bar', data: [a, b]}

    expect(parsed).toEqual([a, b])

  it "should allow you to remove models by reference", ->
    instance = new Collection()
    a = new Model(id: 1, bacon: 'canadian')
    b = new Model(id: 2, bacon: 'smoked')
    c = new Model(id: 3, bacon: 'crunchy')

    instance.add([a, b, c])
    expect(instance.length).toBe(3)
    removed = instance.remove(b)

    expect(instance.length).toBe(2)
    expect(instance.first().get('bacon')).toBe('canadian')
    expect(instance.last().get('bacon')).toBe('crunchy')
    expect(removed).toEqual(b)

  it "should allow you to remove multiple models at once", ->
    instance = new Collection()
    a = new Model(id: 1, bacon: 'canadian')
    b = new Model(id: 2, bacon: 'smoked')
    c = new Model(id: 3, bacon: 'crunchy')

    instance.add([a, b, c])
    expect(instance.length).toBe(3)
    removed = instance.remove([a, b])

    expect(instance.length).toBe(1)
    expect(instance.last().get('bacon')).toBe('crunchy')
    expect(removed).toEqual([a, b])

  it "should not remove any models if the passed model does not exist", ->
    instance = new Collection()
    a = new Model(id: 1, bacon: 'canadian')
    b = new Model(id: 2, bacon: 'smoked')
    c = new Model(id: 3, bacon: 'crunchy')
    d = new Model(id: 4, bacon: 'soppy')

    instance.add([a, b])
    expect(instance.length).toBe(2)
    removed = instance.remove(c)

    expect(instance.length).toBe(2)
    expect(instance.first().get('bacon')).toBe('canadian')
    expect(instance.last().get('bacon')).toBe('smoked')
    expect(removed).toEqual(undefined)

    # note that when attempting to remove multiple arrays, an array is ALWAYS returned
    removed = instance.remove([c, d])
    expect(instance.length).toBe(2)
    expect(instance.first().get('bacon')).toBe('canadian')
    expect(instance.last().get('bacon')).toBe('smoked')
    expect(removed).toEqual([])


  it "should fetch models using its URL property", ->
    instance = new Collection([], url: 'http://google.com')
    a = id: 1, foo: 'bar'
    b = id: 2, foo: 'baz'
    backend.expectGET('http://google.com').respond 200, [a, b]

    expect(instance.length).toBe(0)
    instance.fetch()
    backend.flush()

    expect(instance.length).toBe(2)
    expect(instance.get(1).get('foo')).toBe('bar')
    expect(instance.get(2).get('foo')).toBe('baz')

  it "should fetch models using its URL property", ->
    instance = new Collection([], url: 'http://google.com')
    a = id: 1, foo: 'bar'
    b = id: 2, foo: 'baz'
    backend.expectGET('http://google.com').respond 200, [a, b]

    expect(instance.length).toBe(0)
    instance.fetch()
    backend.flush()

    expect(instance.length).toBe(2)
    expect(instance.get(1).get('foo')).toBe('bar')
    expect(instance.get(2).get('foo')).toBe('baz')

  it "should be able to fetch URLs using a URL method", ->
    instance = new Collection()
    instance.url = -> return ['http://', 'google', '.com'].join('')
    backend.expectGET('http://google.com').respond 200, [id: 1, foo: 'bar']

    instance.fetch()
    backend.flush()

    expect(instance.length).toBe(1)
    expect(instance.get(1).get('foo')).toBe('bar')

  it "should handle gnarly HTTP responses using its parse method", ->
    a = id: 1, foo: 'bar'
    b = id: 2, foo: 'baz'
    instance = new Collection [],
      url: 'http://google.com'
      parse: (res) -> return res.data.deeply.nested.object

    backend.expectGET('http://google.com').respond 200, {deeply: { nested: { object: [a, b] }}}
    instance.fetch()
    backend.flush()

    expect(instance.length).toBe(2)
    expect(instance.get(1).get('foo')).toBe('bar')
    expect(instance.get(2).get('foo')).toBe('baz')

  it "should let you know if it's fetching at the moment", ->
    instance = new Collection([], url: 'http://google.com')
    expect(instance.currentlyFetching).toBe(false)

    backend.expectGET('http://google.com').respond 200, []
    instance.fetch()
    expect(instance.currentlyFetching).toBe(true)

    backend.flush()
    expect(instance.currentlyFetching).toBe(false)

  it "should let you know if it's fetching even after an error", ->
    instance = new Collection([], url: 'http://google.com')
    expect(instance.currentlyFetching).toBe(false)

    backend.expectGET('http://google.com').respond 404
    instance.fetch()
    expect(instance.currentlyFetching).toBe(true)

    backend.flush()
    expect(instance.currentlyFetching).toBe(false)

  it "should let you use different HTTP methods when fetching", ->
    instance = new Collection([], url: 'http://google.com')
    model = id: 5, bacon: 'tasty'

    ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'].forEach (method) ->
      backend["expect#{method}"]('http://google.com').respond(200, [model])

      instance.fetch(method: method)
      backend.flush()

      expect(instance.length).toBe(1)
      expect(instance.get(5).get('bacon')).toBe('tasty')
      instance.reset()

  it "should let you fetch with query string params", ->
    instance = new Collection([], url: 'http://google.com')
    model = id: 5, bacon: 'tasty'
    backend.expectGET('http://google.com?baz=qux&foo=bar').respond(200, [model])

    instance.fetch(params: {baz: 'qux', foo: 'bar'})
    backend.flush()

    expect(instance.length).toBe(1)
    expect(instance.get(5).get('bacon')).toBe('tasty')

  it "should let you fetch with post data", ->
    instance = new Collection([], url: 'http://google.com')
    model = id: 5, bacon: 'tasty'
    backend.expectPOST('http://google.com', {foo: 'bar', baz: 'qux'}).respond(200, [model])

    instance.fetch(method: 'POST', data: {foo: 'bar', baz: 'qux'})
    backend.flush()

    expect(instance.length).toBe(1)
    expect(instance.get(5).get('bacon')).toBe('tasty')

  it "should let you fetch with post data and query strings", ->
    instance = new Collection([], url: 'http://google.com')
    model = id: 5, bacon: 'tasty'
    backend.expectPOST('http://google.com?foo=bar', {baz: 'qux'}).respond(200, [model])

    instance.fetch(method: 'POST', params: {foo: 'bar'}, data: {baz: 'qux'})
    backend.flush()

    expect(instance.length).toBe(1)
    expect(instance.get(5).get('bacon')).toBe('tasty')

  it "shouldn't mutate your options object", ->
    instance = new Collection([], url: 'http://google.com')
    model = id: 5, bacon: 'tasty'
    backend.expectGET('http://google.com').respond 200, [model]

    options = {}
    instance.fetch(options)
    backend.flush()

    expect(options.method).toBe(undefined)
    expect(options.url).toBe(undefined)
    expect(instance.length).toBe(1)
    expect(instance.get(5).get('bacon')).toBe('tasty')

  it "should maintain a sort order when adding models", ->
    instance = new Collection([], url: 'http://google.com')
    a = id: 1, foo: 'bar'
    b = id: 2, foo: 'baz'
    c = id: 3, foo: 'qux'

    instance.add([b, c, a])

    expect(instance.first().get('foo')).toBe('bar')
    expect(instance.last().get('foo')).toBe('qux')

  it "should allow you to add models out of order", ->
    instance = new Collection([], url: 'http://google.com')
    a = id: 1, foo: 'bar'
    b = id: 2, foo: 'baz'
    c = id: 3, foo: 'qux'

    instance.add([b, c, a], sort: false)

    expect(instance.first().get('foo')).toBe('baz')
    expect(instance.last().get('foo')).toBe('bar')

  it "should use the comparator property to determine sort order", ->
    a = id: 1, foo: 'bar'
    b = id: 2, foo: 'baz'
    c = id: 3, foo: 'qux'
    instance = new Collection [],
      url: 'http://google.com'
      comparator: (a, b) -> b.id - a.id

    instance.add([b, c, a])

    expect(instance.first().get('foo')).toBe('qux')
    expect(instance.last().get('foo')).toBe('bar')

  it "should be able to create new models and add them to the collection", ->
    instance = new Collection([], model: FakeModel)
    instance.create({id: 1})

    expect(instance.length).toBe(1)
    expect(instance.last() instanceof FakeModel).toBe(true)

  it "should save newly created models", ->
    instance = new Collection([], model: FakeModel)
    instance.create({id: 1})
    expect(instance.last().save).toHaveBeenCalled()

  it "should not allow you to create duplicates of existing models", ->
    model = new FakeModel(id: 1)
    instance = new Collection([model], model: FakeModel)

    instance.create(model)

    expect(instance.length).toBe(1)
    expect(model.save).not.toHaveBeenCalled()

  it "should return itself from promises", ->
    instance = new Collection([], url: 'http://google.com')
    backend.expectGET('http://google.com').respond 200, []

    instance.fetch().then (collection) ->
      expect(collection).toBe(instance)

    backend.flush()

  it "should let you retrieve models by index", ->
    a = id: 1, foo: 'bar'
    b = id: 2, foo: 'baz'
    c = id: 3, foo: 'qux'
    instance = new Collection([a, b, c])

    expect(instance.eq(0).toJSON()).toEqual(a)
    expect(instance.eq(1).toJSON()).toEqual(b)
    expect(instance.eq(2).toJSON()).toEqual(c)
    expect(instance.eq(3)).toBeUndefined()

  it "should let us find matching objects", ->
    a = id: 1, foo: 'bar', dingus: true
    b = id: 2, foo: 'bar', dingus: true
    c = id: 3, foo: 'qux', dingus: true
    instance = new Collection([a, b, c])

    expect(instance.where(foo: 'bar')).toEqual([instance.eq(0), instance.eq(1)])
    expect(instance.where(id: 2)).toEqual([instance.eq(1)])
    expect(instance.where(dingus: true)).toEqual(instance.models)

  it "should let us find the first match of many", ->
    a = id: 1, foo: 'bar', dingus: true
    b = id: 2, foo: 'bar', dingus: true
    c = id: 3, foo: 'qux', dingus: true
    instance = new Collection([a, b, c])

    expect(instance.where({foo: 'bar'}, true)).toEqual(instance.eq(0))
    expect(instance.findWhere(foo: 'bar')).toEqual(instance.eq(0))

  it "should be able to clone itself", ->
    a = id: 1, foo: 'bar', dingus: true
    b = id: 2, foo: 'bar', dingus: true
    c = id: 3, foo: 'qux', dingus: true
    instance = new Collection([a, b, c])
    clone = instance.clone()

    # we want to check that the two are in fact, different object instances
    expect(instance == clone).toBe(false)
    # guaruntee that the instances have the same properties
    expect(instance.models).toEqual(clone.models)
    expect(instance.opts).toEqual(clone.opts)
    # ensure that we aren't just copying over models to the new collection
    expect(instance.models[0] == clone.models[0]).not.toBe(true)

  it "should convert all of its models to JSON", ->
    a = id: 1, foo: 'bar', dingus: true
    b = id: 2, foo: 'bar', dingus: true
    c = id: 3, foo: 'qux', dingus: true
    instance = new Collection([a, b, c])

    expect(instance.toJSON()).toEqual([a, b, c])
