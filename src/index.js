function assertUndefined(parent, key) {
  if (typeof parent[key] !== 'undefined') {
    throw new Error(`Error, cannot overwrite existing property on class: ${key}`)
  }
}

export const PROVIDED_KEY = '__provided__'

// simple view decorator
export default function instantiate(cb) {
  const injections = {}

  // @view
  function view(Klass) {
    return cb ? cb(Klass) : Klass
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

  // simple dependency set
  view.inject = (injectables: Object) => {
    for (const key of Object.keys(injectables)) {
      if (typeof injections[key] !== 'undefined' && !(module && module.hot)) {
        throw new Error(`Already injected ${key} into app`)
      }
      injections[key] = injectables[key]
    }
    return view
  }

  // simple dependency get
  view.provide = (...list) => moduleOrComponent => {
    const isReactClass = typeof moduleOrComponent === 'function'
    return isReactClass
      ? view(moduleOrComponent)
      // nest one more layer if we have motion-hmr transform
      : Klass => view(attachObjects(Klass, list))
  }

  return view
}
