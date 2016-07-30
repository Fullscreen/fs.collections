/* global describe, jasmine, it, beforeEach, inject, expect, spyOn */
/* eslint-disable no-return-assign */
describe('The dependable BaseCollection', function () {
  let Collection
  let Model
  let backend

  class FakeModel {
    constructor (attrs) {
      if (__guard__(attrs, x => x.id)) { this.id = attrs.id }

      // Spy on the constructor and fetch methods
      this.spy = jasmine.createSpy()
      this.save = jasmine.createSpy()
      this.spy(attrs)
    }
  }

  beforeEach(function () {
    angular.mock.module('fs.collections')
    return inject(function (BaseCollection, BaseModel, $httpBackend) {
      Collection = BaseCollection
      Model = BaseModel
      return backend = $httpBackend
    })
  })

  it('should create models using the objects you pass it', function () {
    let instance = new Collection([{id: 1}, {id: 2}, {id: 3}])
    expect(instance.length).toBe(3)
    expect(instance.models[0] instanceof Model).toBe(true)
    expect(instance.models[0].id).toBe(1)

    expect(instance.models[1] instanceof Model).toBe(true)
    expect(instance.models[1].id).toBe(2)

    expect(instance.models[2] instanceof Model).toBe(true)
    expect(instance.models[2].id).toBe(3)

    return expect(instance.models[3]).toBeUndefined()
  }
  )

  it('should store url, model options passed to it on the collection', function () {
    let instance = new Collection([], {url: 'http://google.com', model: FakeModel, parse: true, fizz: 'buzz'})

    expect(instance.length).toBe(0)
    expect(instance.url).toBe('http://google.com')
    expect(instance.model).toBe(FakeModel)
    expect(instance.parse).not.toBe(true)
    return expect(instance.fizz).toBeUndefined()
  }
  )

  it('should initialize new models using its "model" attribute', function () {
    let instance = new Collection([{id: 1}], {model: FakeModel})
    expect(instance.length).toBe(1)
    expect(instance.models[0] instanceof FakeModel).toBe(true)
    return expect(instance.models[0].spy).toHaveBeenCalledWith({id: 1})
  }
  )

  it('should be able to handle being passed both objects and models', function () {
    let instance = new Collection([{id: 1}, {id: 2}], {model: FakeModel})

    expect(instance.length).toBe(2)
    expect(instance.models[0] instanceof FakeModel).toBe(true)
    expect(instance.models[0].spy.calls.count()).toBe(1)

    expect(instance.models[1] instanceof FakeModel).toBe(true)
    return expect(instance.models[1].spy.calls.count()).toBe(1)
  }
  )

  it('should store a reference to iself on its models', function () {
    let instance = new Collection([{id: 1}, new Model({id: 2})])
    expect(instance.models[0].collection).toBe(instance)
    return expect(instance.models[1].collection).toBe(instance)
  }
  )

  it('should empty its model store when reset', function () {
    let instance = new Collection([{id: 1}, new Model({id: 2})])
    expect(instance.length).toBe(2)
    expect(instance.models.length).toBe(2)

    instance.reset()

    expect(instance.length).toBe(0)
    return expect(instance.models.length).toBe(0)
  }
  )

  it('should let you look up models based on their ID', function () {
    let a = new Model({id: 1})
    let b = new Model({id: 2})
    let c = new Model({id: 'foo'})
    let instance = new Collection([a, b, c])

    expect(instance.get(1)).toBe(a)
    expect(instance.get(2)).toBe(b)
    expect(instance.get('foo')).toBe(c)
    expect(instance.get(3)).toBeUndefined()
    return expect(instance.get('3')).toBeUndefined()
  }
  )

  it('should prevent you from adding a model with the same id twice', function () {
    let instance = new Collection()
    let a = new Model({id: 1, bacon: 'canadian'})
    let b = new Model({id: 2, bacon: 'smoked'})
    let c = new Model({id: 2, bacon: 'crunchy'})

    instance.add([a, b, c])

    expect(instance.length).toBe(2)
    return expect(instance.get(2).get('bacon')).toBe('smoked')
  }
  )

  it('should let you add multiple models at once', function () {
    let instance = new Collection()
    let a = new Model({id: 1, bacon: 'canadian'})
    let b = new Model({id: 2, bacon: 'smoked'})
    let c = new Model({id: 3, bacon: 'crunchy'})

    instance.add([a, b, c])

    expect(instance.length).toBe(3)
    return expect(instance.get(2).get('bacon')).toBe('smoked')
  }
  )

  it('should let you add models at a specific index', function () {
    let instance = new Collection([], {sort () {}}) // disable sorting to allow this to work
    let a = {id: 1, bacon: 'canadian'}
    let b = {id: 2, bacon: 'smoked'}
    let c = {id: 3, bacon: 'crunchy'}

    instance.add(a)
    instance.add([b, c], {at: 0})

    expect(instance.length).toBe(3)
    return expect(instance.toJSON()).toEqual([b, c, a])
  }
  )

  it('should pluck attributes from its models', function () {
    let instance = new Collection()
    let a = new Model({id: 1, bacon: 'canadian'})
    let b = new Model({id: 2, bacon: 'smoked'})
    let c = new Model({id: 3, bacon: 'crunchy'})

    instance.add([a, b, c])
    let typesOfBacon = instance.pluck('bacon')

    return expect(typesOfBacon).toEqual(['canadian', 'smoked', 'crunchy'])
  }
  )

  it('should pluck the data key from incoming HTTP responses', function () {
    let instance = new Collection()
    let a = new Model()
    let b = new Model()

    let parsed = instance.parse({headers: 'foo', things: 'bar', data: [a, b]})

    return expect(parsed).toEqual([a, b])
  }
  )

  it('should allow you to remove models by reference', function () {
    let instance = new Collection()
    let a = new Model({id: 1, bacon: 'canadian'})
    let b = new Model({id: 2, bacon: 'smoked'})
    let c = new Model({id: 3, bacon: 'crunchy'})

    instance.add([a, b, c])
    expect(instance.length).toBe(3)
    let removed = instance.remove(b)

    expect(instance.length).toBe(2)
    expect(instance.first().get('bacon')).toBe('canadian')
    expect(instance.last().get('bacon')).toBe('crunchy')
    return expect(removed).toEqual(b)
  }
  )

  it('should allow you to remove multiple models at once', function () {
    let instance = new Collection()
    let a = new Model({id: 1, bacon: 'canadian'})
    let b = new Model({id: 2, bacon: 'smoked'})
    let c = new Model({id: 3, bacon: 'crunchy'})

    instance.add([a, b, c])
    expect(instance.length).toBe(3)
    let removed = instance.remove([a, b])

    expect(instance.length).toBe(1)
    expect(instance.last().get('bacon')).toBe('crunchy')
    return expect(removed).toEqual([a, b])
  }
  )

  it('should not remove any models if the passed model does not exist', function () {
    let instance = new Collection()
    let a = new Model({id: 1, bacon: 'canadian'})
    let b = new Model({id: 2, bacon: 'smoked'})
    let c = new Model({id: 3, bacon: 'crunchy'})
    let d = new Model({id: 4, bacon: 'soppy'})

    instance.add([a, b])
    expect(instance.length).toBe(2)
    let removed = instance.remove(c)

    expect(instance.length).toBe(2)
    expect(instance.first().get('bacon')).toBe('canadian')
    expect(instance.last().get('bacon')).toBe('smoked')
    expect(removed).toEqual(undefined)

    // note that when attempting to remove multiple arrays, an array is ALWAYS returned
    removed = instance.remove([c, d])
    expect(instance.length).toBe(2)
    expect(instance.first().get('bacon')).toBe('canadian')
    expect(instance.last().get('bacon')).toBe('smoked')
    return expect(removed).toEqual([])
  }
  )

  it('should fetch models using its URL property', function () {
    let instance = new Collection([], {url: 'http://google.com'})
    let a = {id: 1, foo: 'bar'}
    let b = {id: 2, foo: 'baz'}
    backend.expectGET('http://google.com').respond(200, [a, b])

    expect(instance.length).toBe(0)
    instance.fetch()
    backend.flush()

    expect(instance.length).toBe(2)
    expect(instance.get(1).get('foo')).toBe('bar')
    return expect(instance.get(2).get('foo')).toBe('baz')
  }
  )

  it('should be able to fetch URLs using a URL method', function () {
    let instance = new Collection()
    instance.url = () => ['http://', 'google', '.com'].join('')
    backend.expectGET('http://google.com').respond(200, [{id: 1, foo: 'bar'}])

    instance.fetch()
    backend.flush()

    expect(instance.length).toBe(1)
    return expect(instance.get(1).get('foo')).toBe('bar')
  }
  )

  it('should merge fetched models by default', function () {
    let a = {id: 1, foo: 'bar'}
    let b = {id: 2, foo: 'baz'}
    let instance = new Collection([a, b], {url: 'http://google.com'})
    backend.expectGET('http://google.com').respond(200, [{id: 1, foo: 'buzz'}, b])

    instance.fetch()
    backend.flush()

    expect(instance.length).toBe(2)
    expect(instance.get(1).get('foo')).toBe('buzz')
    return expect(instance.get(2).get('foo')).toBe('baz')
  }
  )

  it('should not merge fetched models when asked', function () {
    let a = {id: 1, foo: 'bar'}
    let b = {id: 2, foo: 'baz'}
    let instance = new Collection([a, b], {url: 'http://google.com'})
    backend.expectGET('http://google.com').respond(200, [{id: 1, foo: 'buzz'}, b])

    instance.fetch({merge: false})
    backend.flush()

    expect(instance.length).toBe(2)
    expect(instance.get(1).get('foo')).toBe('bar')
    return expect(instance.get(2).get('foo')).toBe('baz')
  }
  )

  it('should handle gnarly HTTP responses using its parse method', function () {
    let a = {id: 1, foo: 'bar'}
    let b = {id: 2, foo: 'baz'}
    let instance = new Collection([], {
      url: 'http://google.com',
      parse (res) { return res.data.deeply.nested.object }
    }
    )

    backend.expectGET('http://google.com').respond(200, {
      deeply: {
        nested: {
          object: [a, b]
        }
      }
    })
    instance.fetch()
    backend.flush()

    expect(instance.length).toBe(2)
    expect(instance.get(1).get('foo')).toBe('bar')
    return expect(instance.get(2).get('foo')).toBe('baz')
  }
  )

  it('should let you know if its fetching at the moment', function () {
    let instance = new Collection([], {url: 'http://google.com'})
    expect(instance.currentlyFetching).toBe(false)

    backend.expectGET('http://google.com').respond(200, [])
    instance.fetch()
    expect(instance.currentlyFetching).toBe(true)

    backend.flush()
    return expect(instance.currentlyFetching).toBe(false)
  }
  )

  it('should let you know if its fetching even after an error', function () {
    let instance = new Collection([], {url: 'http://google.com'})
    expect(instance.currentlyFetching).toBe(false)

    backend.expectGET('http://google.com').respond(404)
    instance.fetch()
    expect(instance.currentlyFetching).toBe(true)

    backend.flush()
    return expect(instance.currentlyFetching).toBe(false)
  }
  )

  it('should let you use different HTTP methods when fetching', function () {
    let instance = new Collection([], {url: 'http://google.com'})
    let model = {id: 5, bacon: 'tasty'}

    return ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'].forEach(function (method) {
      backend[`expect${method}`]('http://google.com').respond(200, [model])

      instance.fetch({method})
      backend.flush()

      expect(instance.length).toBe(1)
      expect(instance.get(5).get('bacon')).toBe('tasty')
      return instance.reset()
    })
  }
  )

  it('should let you fetch with query string params', function () {
    let instance = new Collection([], {url: 'http://google.com'})
    let model = {id: 5, bacon: 'tasty'}
    backend.expectGET('http://google.com?baz=qux&foo=bar').respond(200, [model])

    instance.fetch({params: {baz: 'qux', foo: 'bar'}})
    backend.flush()

    expect(instance.length).toBe(1)
    return expect(instance.get(5).get('bacon')).toBe('tasty')
  }
  )

  it('should let you fetch with post data', function () {
    let instance = new Collection([], {url: 'http://google.com'})
    let model = {id: 5, bacon: 'tasty'}
    backend.expectPOST('http://google.com', {foo: 'bar', baz: 'qux'}).respond(200, [model])

    instance.fetch({method: 'POST', data: {foo: 'bar', baz: 'qux'}})
    backend.flush()

    expect(instance.length).toBe(1)
    return expect(instance.get(5).get('bacon')).toBe('tasty')
  }
  )

  it('should let you fetch with post data and query strings', function () {
    let instance = new Collection([], {url: 'http://google.com'})
    let model = {id: 5, bacon: 'tasty'}
    backend.expectPOST('http://google.com?foo=bar', {baz: 'qux'}).respond(200, [model])

    instance.fetch({method: 'POST', params: {foo: 'bar'}, data: {baz: 'qux'}})
    backend.flush()

    expect(instance.length).toBe(1)
    return expect(instance.get(5).get('bacon')).toBe('tasty')
  }
  )

  it('shouldnt mutate your options object', function () {
    let instance = new Collection([], {url: 'http://google.com'})
    let model = {id: 5, bacon: 'tasty'}
    backend.expectGET('http://google.com').respond(200, [model])

    let options = {}
    instance.fetch(options)
    backend.flush()

    expect(options.method).toBe(undefined)
    expect(options.url).toBe(undefined)
    expect(instance.length).toBe(1)
    return expect(instance.get(5).get('bacon')).toBe('tasty')
  }
  )

  it('should maintain a sort order when adding models', function () {
    let instance = new Collection([], {url: 'http://google.com'})
    let a = {id: 1, foo: 'bar'}
    let b = {id: 2, foo: 'baz'}
    let c = {id: 3, foo: 'qux'}
    instance.comparator = (a, b) => a.id - b.id

    instance.add([b, c, a])

    expect(instance.first().get('foo')).toBe('bar')
    return expect(instance.last().get('foo')).toBe('qux')
  }
  )

  it('should not sort unless a comparator is defined', function () {
    let instance = new Collection([], {url: 'http://google.com'})
    let a = {id: 1, foo: 'bar'}
    let b = {id: 2, foo: 'baz'}
    let c = {id: 3, foo: 'qux'}

    instance.add([b, c, a])

    expect(instance.first().get('foo')).toBe('baz')
    return expect(instance.last().get('foo')).toBe('bar')
  }
  )

  it('should allow you to add models out of order', function () {
    let instance = new Collection([], {url: 'http://google.com'})
    let a = {id: 1, foo: 'bar'}
    let b = {id: 2, foo: 'baz'}
    let c = {id: 3, foo: 'qux'}

    instance.add([b, c, a], {sort: false})

    expect(instance.first().get('foo')).toBe('baz')
    return expect(instance.last().get('foo')).toBe('bar')
  }
  )

  it('should use the comparator property to determine sort order', function () {
    let a = {id: 1, foo: 'bar'}
    let b = {id: 2, foo: 'baz'}
    let c = {id: 3, foo: 'qux'}
    let instance = new Collection([], {
      url: 'http://google.com',
      comparator (a, b) { return b.id - a.id }
    }
    )

    instance.add([b, c, a])

    expect(instance.first().get('foo')).toBe('qux')
    return expect(instance.last().get('foo')).toBe('bar')
  }
  )

  it('should be able to create new models and add them to the collection', function () {
    let instance = new Collection([], {model: FakeModel})
    instance.create({id: 1})

    expect(instance.length).toBe(1)
    return expect(instance.last() instanceof FakeModel).toBe(true)
  }
  )

  it('should save newly created models', function () {
    let instance = new Collection([], {model: FakeModel})
    instance.create({id: 1})
    return expect(instance.last().save).toHaveBeenCalled()
  }
  )

  it('should not allow you to create duplicates of existing models', function () {
    let model = new FakeModel({id: 1})
    let instance = new Collection([model], {model: FakeModel})

    instance.create(model)

    expect(instance.length).toBe(1)
    return expect(model.save).not.toHaveBeenCalled()
  }
  )

  it('should return itself from promises', function () {
    let instance = new Collection([], {url: 'http://google.com'})
    backend.expectGET('http://google.com').respond(200, [])

    instance.fetch().then(collection => expect(collection).toBe(instance))

    return backend.flush()
  }
  )

  it('should let you retrieve models by index', function () {
    let a = {id: 1, foo: 'bar'}
    let b = {id: 2, foo: 'baz'}
    let c = {id: 3, foo: 'qux'}
    let instance = new Collection([a, b, c])

    expect(instance.eq(0).toJSON()).toEqual(a)
    expect(instance.eq(1).toJSON()).toEqual(b)
    expect(instance.eq(2).toJSON()).toEqual(c)
    return expect(instance.eq(3)).toBeUndefined()
  }
  )

  it('should let us find matching objects', function () {
    let a = {id: 1, foo: 'bar', dingus: true}
    let b = {id: 2, foo: 'bar', dingus: true}
    let c = {id: 3, foo: 'qux', dingus: true}
    let instance = new Collection([a, b, c])

    expect(instance.where({foo: 'bar'})).toEqual([instance.eq(0), instance.eq(1)])
    expect(instance.where({id: 2})).toEqual([instance.eq(1)])
    return expect(instance.where({dingus: true})).toEqual(instance.models)
  }
  )

  it('should let us find the first match of many', function () {
    let a = {id: 1, foo: 'bar', dingus: true}
    let b = {id: 2, foo: 'bar', dingus: true}
    let c = {id: 3, foo: 'qux', dingus: true}
    let instance = new Collection([a, b, c])

    expect(instance.where({foo: 'bar'}, true)).toEqual(instance.eq(0))
    return expect(instance.findWhere({foo: 'bar'})).toEqual(instance.eq(0))
  }
  )

  it('should be able to clone itself', function () {
    let a = {id: 1, foo: 'bar', dingus: true}
    let b = {id: 2, foo: 'bar', dingus: true}
    let c = {id: 3, foo: 'qux', dingus: true}
    let instance = new Collection([a, b, c])
    let clone = instance.clone()
    let toAttrs = m => m.attributes

    // we want to check that the two are in fact, different object instances
    expect(instance === clone).toBe(false)
    // guaruntee that the instances have the same properties
    expect(instance.models.map(toAttrs)).toEqual(clone.models.map(toAttrs))
    expect(instance.opts).toEqual(clone.opts)
    // ensure that we aren't just copying over models to the new collection
    return expect(instance.models[0] === clone.models[0]).not.toBe(true)
  }
  )

  it('should convert all of its models to JSON', function () {
    let a = {id: 1, foo: 'bar', dingus: true}
    let b = {id: 2, foo: 'bar', dingus: true}
    let c = {id: 3, foo: 'qux', dingus: true}
    let instance = new Collection([a, b, c])

    return expect(instance.toJSON()).toEqual([a, b, c])
  }
  )

  it('should parse data from constructor if requested', function () {
    let a = {id: 1, foo: 'bar', dingus: true}
    let b = {id: 2, foo: 'bar', dingus: true}
    let c = {id: 3, foo: 'qux', dingus: true}
    spyOn(Collection.prototype, 'parse').and.callThrough()
    let instance = new Collection([a, b, c], {parse: true})
    return expect(instance.parse).toHaveBeenCalled()
  }
  )

  it('should parse data from add if requested', function () {
    let a = {id: 1, foo: 'bar', dingus: true}
    let b = {id: 2, foo: 'bar', dingus: true}
    let c = {id: 3, foo: 'qux', dingus: true}
    spyOn(Collection.prototype, 'parse').and.callThrough()
    let instance = new Collection()
    expect(instance.parse).not.toHaveBeenCalled()
    instance.add([a, b, c], {parse: true})
    return expect(instance.parse).toHaveBeenCalled()
  }
  )

  it('should merge models from add if requested', function () {
    let a = {id: 1, foo: 'bar'}
    let b = {id: 2, foo: 'baz'}
    let instance = new Collection([a, b], {url: 'http://google.com'})

    instance.add([{id: 1, foo: 'buzz'}, {id: 3, foo: 'fizz'}], {merge: true})

    expect(instance.length).toBe(3)
    expect(instance.get(1).get('foo')).toBe('buzz')
    expect(instance.get(2).get('foo')).toBe('baz')
    return expect(instance.get(3).get('foo')).toBe('fizz')
  }
  )

  it('should parse Models using their parse method on fetch', function () {
    let a = {id: 1, foo: 'bar', dingus: true}
    let b = {id: 2, foo: 'bar', dingus: true}
    let c = {id: 3, foo: 'qux', dingus: true}
    let mockurl = 'https://google.com'
    class MockModel extends Model {
      parse (res) {
        return res.data
      }
    }
    backend.expectGET(mockurl).respond([{data: a}, {data: b}, {data: c}])
    let instance = new Collection(undefined, {model: MockModel, url: mockurl})
    instance.fetch()
    backend.flush()
    return expect(instance.toJSON()).toEqual([a, b, c])
  }
  )

  it('should allow passing options to add via create', function () {
    spyOn(Collection.prototype, 'add').and.callThrough()
    let instance = new Collection()
    instance.create({asdf: 'fdfd'}, {parse: true, foo: 'baz'})
    return expect(instance.add).toHaveBeenCalledWith({asdf: 'fdfd'}, {parse: true, foo: 'baz'})
  }
  )

  it('should allow passing options through on merge', function () {
    let instance = new Collection()
    let mergable = {id: 'foo'}
    let m = instance.add(mergable)
    spyOn(m, 'set')
    let opts = {merge: true, reset: false}
    instance.add(mergable, opts)
    opts.sort = true
    return expect(m.set).toHaveBeenCalledWith(mergable, opts)
  }
  )

  return it('should treat collections the same as models when adding', function () {
    let instance = new Collection()
    let coll = new Collection({id: 'foo'})
    let m = instance.add(coll)
    expect(m).toBe(coll)
    return expect(m.collection).toBe(instance)
  }
  )
}
)

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
