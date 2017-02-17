function assertUndefined(parent, key) {
  if (typeof parent[key] !== 'undefined') {
    throw new Error(`Error, cannot overwrite existing property on class: ${key}`)
  }
}

export const PROVIDED_KEY = '__provided__'
const DEV_MODE = process.env.NODE_ENV === 'development'

// simple view decorator
export default function createViewDecorator(wrap: Function) {
  const injections = {}

  // @view
  function view(Component) {
    // let user customize
    const DecoratedComponent = wrap ? wrap(Component) : Component
    // add injections
    Object.defineProperties(DecoratedComponent.prototype, injections)
    return DecoratedComponent
  }

  // collect injections + objects for provide
  function getProvides(parent: Class<T>, provides: Array<Object | string>): Object {
    const result = {
      injections: {},
      provides: {}
    }
    for (const key of provides) {
      // attach injection
      if (typeof key === 'string') {
        if (typeof injections[key] === 'undefined') {
          throw new Error(`Attempting to provide ${key} without first injecting, try @view.inject()`)
        }
        assertUndefined(parent, key)
        result.injections[key] = injections[key]
      }
      else {
        // attach object
        const provide = key
        if (provide instanceof Object) {
          for (const subKey of Object.keys(provide)) {
            assertUndefined(parent, subKey)
            result.provides[subKey] = provide[subKey]
          }
        }
      }
    }
    return result
  }

  // attach objects to class
  function attachObjects(Klass, provisions: Array<Object>) {
    const { injections, provides } = getProvides(Klass, provisions)
    Object.keys(injections).forEach(key => {
      Object.defineProperty(Klass.prototype, key, {
        get: function() { return injections[key] }
      })
    })
    Object.defineProperty(Klass.prototype, PROVIDED_KEY, {
      get: function() { return provides }
    })
    return Klass
  }

  // attach objects to every class
  view.inject = (injectables: Object) => {
    for (const key of Object.keys(injectables)) {
      if (typeof injections[key] !== 'undefined' && !(module && module.hot)) {
        throw new Error(`Already injected ${key} into app`)
      }
      injections[key] = {
        get: () => injectables[key],
      }
    }
    return view
  }

  // simple dependency get
  view.provide = (...list) => moduleOrComponent => {
    const isReactClass = typeof moduleOrComponent === 'function'
    if (isReactClass) {
      return view(moduleOrComponent)
    }
    // nest one more fn, via motion-hmr transform
    return Klass => view(attachObjects(Klass, list))
  }

  return view
}

// export @view by default
export const view = createViewDecorator()
