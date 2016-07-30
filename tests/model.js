/* global describe, jasmine, it, beforeEach, inject, expect */
/* eslint-disable no-return-assign */
describe('The enigmatic BaseModel', function () {
  let $rootScope
  let Model
  let http

  beforeEach(function () {
    angular.mock.module('fs.collections')
    return inject(function (_$rootScope_, _BaseModel_, _$httpBackend_) {
      $rootScope = _$rootScope_
      Model = _BaseModel_
      return http = _$httpBackend_
    })
  })

  it('should build a URL based on its ID and URLRoot', function () {
    let models = [
      { // No id, trailing slash
        url: 'http://community.fullscreen.dev/',
        model: new Model({}, {urlRoot: 'http://community.fullscreen.dev/'})
      },
      { // No id, no trailing slash
        url: 'http://community.fullscreen.dev/',
        model: new Model({}, {urlRoot: 'http://community.fullscreen.dev'})
      },
      { // Id, trailing slash
        url: 'http://community.fullscreen.dev/foo',
        model: new Model({id: 'foo'}, {urlRoot: 'http://community.fullscreen.dev/'})
      },
      { // Id, no trailing slash
        url: 'http://community.fullscreen.dev/foo',
        model: new Model({id: 'foo'}, {urlRoot: 'http://community.fullscreen.dev'})
      }
    ]

    return models.forEach(function (test) {
      http.expectGET(test.url).respond(200)
      return test.model.fetch()
    })
  }
  )

  it('should be able to urlRoot functions', function () {
    let url = 'http://google.com'
    let staticUrlRoot = new Model({}, {urlRoot: url})
    let functionUrlRoot = new Model({}, {urlRoot () { return url }})

    http.expectGET(url).respond(200)
    staticUrlRoot.fetch()

    http.expectGET(url).respond(200)
    return functionUrlRoot.fetch()
  }
  )

  it('should be able to url functions', function () {
    let url = 'http://google.com'
    let model = new Model({})

    http.expectGET(url).respond(200)
    model.fetch({url})

    class UrlModel extends Model {
      url () { return url }
    }
    model = new UrlModel({})
    http.expectGET(url).respond(200)
    return model.fetch()
  })

  it('should extract IDs from the attributes its given', function () {
    let instance = new Model({id: 100})
    return expect(instance.id).toBe(100)
  }
  )

  it('should update its ID attribute when setting values', function () {
    let instance = new Model({id: 'foo'})
    expect(instance.id).toBe('foo')

    instance.set({ id: 'bar', baz: 'qux' })
    expect(instance.id).toBe('bar')
    return expect(instance.get('baz')).toBe('qux')
  }
  )

  it('should allow you to set a custom id field', function () {
    let instance = new Model({slug: 'foo'}, {idAttribute: 'slug'})
    expect(instance.id).toBe('foo')
    instance.set({slug: 'bar'})
    return expect(instance.id).toBe('bar')
  }
  )

  it('should allow you to set default parameters', function () {
    let instance = new Model({ foo: 'bar', falsy: true }, {defaults: {
      foo: true,
      baz: 'qux',
      falsy: false
    }})

    // Don't clobber existing attributes
    expect(instance.attributes.foo).toBe('bar')
    expect(instance.attributes.falsy).toBe(true)

    // Expose default attributes
    return expect(instance.attributes.baz).toBe('qux')
  }
  )

  it('should copy attributes instead of referencing them', function () {
    let attrs = {publish_at: undefined}
    let instance = new Model(attrs, {defaults: {publish_at: 'bar'}})
    expect(attrs.publish_at).toBe(undefined)
    expect(instance).toBeDefined()
  }
  )

  it('should fire an event when a models attributes change', function () {
    let model = new Model({foo: 'bar', a: 1})
    let changeSpy = jasmine.createSpy('change')
    model.on('change', changeSpy)

    model.set({foo: 'baz'})
    $rootScope.$digest()
    expect(changeSpy).toHaveBeenCalledWith(model, {foo: 'baz'})

    model.set('foo', 'omg')
    return expect(changeSpy).toHaveBeenCalledWith(model, {foo: 'omg'})
  }
  )

  it('should fire an event when a model individual attribute changes', function () {
    let model = new Model({foo: 'bar', a: 1})
    let changeSpy = jasmine.createSpy('change:attr')
    model.on('change:foo', changeSpy)

    model.set({foo: 'baz'})
    return expect(changeSpy).toHaveBeenCalledWith(model, 'baz')
  }
  )

  it('shouldnt fire a change event if nothing changed', function () {
    let model = new Model({foo: 'bar', a: 1})
    let changeSpy = jasmine.createSpy('change:attr')
    model.on('change:foo', changeSpy)

    model.set('foo', 'bar')
    model.set({foo: 'bar'})

    return expect(changeSpy).not.toHaveBeenCalled()
  }
  )

  it('should fire an event when a model is destroyed', function () {
    let model = new Model({foo: 'bar', a: 1})
    let destroySpy = jasmine.createSpy('destroy')
    model.on('destroy', destroySpy)

    model.destroy({some: 'options'})
    return expect(destroySpy).toHaveBeenCalledWith(model, undefined, {some: 'options'})
  }
  )

  it('should let you unbind an individual callback', function () {
    let model = new Model({foo: 'bar', a: 1})
    let changeSpy = jasmine.createSpy('change')
    model.on('change', changeSpy)

    model.set({some: 'options'})
    model.off('change', changeSpy)
    model.set({some: 'options'})

    return expect(changeSpy.calls.count()).toBe(1)
  }
  )

  it('should let you unbind all callbacks for an event', function () {
    let model = new Model({foo: 'bar', a: 1})
    let spy1 = jasmine.createSpy('change1')
    let spy2 = jasmine.createSpy('change2')

    model.on('change', spy1)
    model.on('change', spy2)

    model.set({some: 'options'})

    expect(spy1.calls.count()).toBe(1)
    expect(spy2.calls.count()).toBe(1)

    model.off('change')

    model.set({some: 'options'})

    expect(spy1.calls.count()).toBe(1)
    return expect(spy2.calls.count()).toBe(1)
  }
  )

  it('should let you bind a single-run callback', function () {
    let model = new Model({foo: 'bar', a: 1})
    let changeSpy = jasmine.createSpy('change')
    model.once('change', changeSpy)

    model.set({foo: 'abc'})
    model.set({foo: 'baz'})

    expect(changeSpy.calls.count()).toBe(1)
    return expect(changeSpy.calls.mostRecent().args.pop()).toEqual({foo: 'abc'})
  }
  )

  return it('should parse data directly if asked', function () {
    let mockData = {foo: 'bar', a: 1}
    let model = new Model(mockData, {parse: true})
    return expect(model.toJSON()).toEqual(mockData)
  }
  )
}
)
