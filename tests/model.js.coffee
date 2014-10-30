describe "The enigmatic BaseModel", ->
  $rootScope = undefined
  Model = undefined
  http = undefined

  beforeEach ->
    module('fs.collections')
    inject (_$rootScope_, _BaseModel_, _$httpBackend_) ->
      $rootScope = _$rootScope_
      Model = _BaseModel_
      http = _$httpBackend_

  it "should build a URL based on its ID and URLRoot", ->
    models = [
      { # No id, trailing slash
        url:   'http://community.fullscreen.dev/'
        model: new Model({}, {urlRoot: 'http://community.fullscreen.dev/'})
      },
      { # No id, no trailing slash
        url:   'http://community.fullscreen.dev/'
        model: new Model({}, {urlRoot: 'http://community.fullscreen.dev'})
      },
      { # Id, trailing slash
        url:   'http://community.fullscreen.dev/foo'
        model: new Model({id: 'foo'}, {urlRoot: 'http://community.fullscreen.dev/'})
      },
      { # Id, no trailing slash
        url:   'http://community.fullscreen.dev/foo'
        model: new Model({id: 'foo'}, {urlRoot: 'http://community.fullscreen.dev'})
      }
    ]

    models.forEach (test) ->
      http.expectGET(test.url).respond(200)
      test.model.fetch()

  it "should be able to urlRoot functions", ->
    url = 'http://google.com'
    staticUrlRoot  = new Model({}, urlRoot: url)
    functionUrlRoot = new Model({}, urlRoot: -> url)

    http.expectGET(url).respond(200)
    staticUrlRoot.fetch()

    http.expectGET(url).respond(200)
    functionUrlRoot.fetch()

  it "should be able to url functions", ->
    url = 'http://google.com'
    staticUrl  = new Model({}, url: url)
    functionUrl = new Model({}, url: -> url)

    http.expectGET(url).respond(200)
    staticUrl.fetch()

    http.expectGET(url).respond(200)
    functionUrl.fetch()

  it "should extract IDs from the attributes its given", ->
    instance = new Model({id: 100})
    expect(instance.id).toBe(100)

  it "should update its ID attribute when setting values", ->
    instance = new Model(id: 'foo')
    expect(instance.id).toBe('foo')

    instance.set({ id: 'bar', baz: 'qux' })
    expect(instance.id).toBe('bar')
    expect(instance.get('baz')).toBe('qux')

  it "should allow you to set a custom id field", ->
    instance = new Model({slug: 'foo'}, idAttribute: 'slug')
    expect(instance.id).toBe('foo')
    instance.set({slug: 'bar'})
    expect(instance.id).toBe('bar')

  it "should allow you to set default parameters", ->
    instance = new Model({ foo: 'bar', falsy: true }, defaults: {
      foo: true
      baz: 'qux'
      falsy: false
    })

    # Don't clobber existing attributes
    expect(instance.attributes.foo).toBe('bar')
    expect(instance.attributes.falsy).toBe(true)

    # Expose default attributes
    expect(instance.attributes.baz).toBe('qux')

  it "should copy attributes instead of referencing them", ->
    attrs = {publish_at: undefined}
    instance = new Model attrs, defaults: {publish_at: 'bar'}
    expect(attrs.publish_at).toBe(undefined)

  it "should fire an event when a model's attributes change", ->
    model = new Model({foo: 'bar', a: 1})
    changeSpy = jasmine.createSpy('change')
    model.on 'change', changeSpy

    model.set({foo: 'baz'})
    $rootScope.$digest()
    expect(changeSpy).toHaveBeenCalledWith(model, {foo: 'baz'})

    model.set('foo', 'omg')
    expect(changeSpy).toHaveBeenCalledWith(model, {foo: 'omg'})

  it "should fire an event when a model individual attribute changes", ->
    model = new Model({foo: 'bar', a: 1})
    changeSpy = jasmine.createSpy('change:attr')
    model.on 'change:foo', changeSpy

    model.set({foo: 'baz'})
    expect(changeSpy).toHaveBeenCalledWith(model, 'baz')

  it "should fire an event when a model is destroyed", ->
    model = new Model({foo: 'bar', a: 1})
    destroySpy = jasmine.createSpy('destroy')
    model.on 'destroy', destroySpy

    model.destroy({some: 'options'})
    expect(destroySpy).toHaveBeenCalledWith(model, undefined, {some: 'options'})

  it "should let you unbind an individual callback", ->
    model = new Model({foo: 'bar', a: 1})
    changeSpy = jasmine.createSpy('change')
    model.on 'change', changeSpy

    model.set({some: 'options'})
    model.off('change', changeSpy)
    model.set({some: 'options'})

    expect(changeSpy.callCount).toBe(1)

  it "should let you unbind all callbacks for an event", ->
    model = new Model({foo: 'bar', a: 1})
    spy1 = jasmine.createSpy('change1')
    spy2 = jasmine.createSpy('change2')

    model.on 'change', spy1
    model.on 'change', spy2

    model.set({some: 'options'})

    expect(spy1.callCount).toBe(1)
    expect(spy2.callCount).toBe(1)

    model.off 'change'

    model.set({some: 'options'})

    expect(spy1.callCount).toBe(1)
    expect(spy2.callCount).toBe(1)

  it "should let you bind a single-run callback", ->
    model = new Model({foo: 'bar', a: 1})
    changeSpy = jasmine.createSpy('change')
    model.once 'change', changeSpy

    model.set({foo: 'abc'})
    model.set({foo: 'baz'})

    expect(changeSpy.callCount).toBe(1)
    expect(changeSpy.mostRecentCall.args.pop()).toEqual({foo: 'abc'})

