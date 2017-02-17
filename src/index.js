function assertUndefined(parent, key) {
  if (typeof parent[key] !== 'undefined') {
    throw new Error(`Error, cannot overwrite existing property on class: ${key}`)
  }
}

// simple view decorator
export default function instantiate(cb) {
  const injections = {}

  function view(Klass) {
    return cb ? cb(Klass) : Klass
  }

  // dead-simple dependency injection
  view.inject = (injectables: Object) => {
    for (const key of Object.keys(injectables)) {
      if (typeof injections[key] !== 'undefined' && !(module && module.hot)) {
        throw new Error(`Already injected ${key} into app`)
      }
      injections[key] = injectables[key]
    }
    return view
  }

  function getProvides(parent, provides) {
    const result = {}
    for (const key of provides) {
      // attach injection
      if (typeof key === 'string') {
        if (typeof injections[key] === 'undefined') {
          throw new Error(`Attempting to provide ${key} without first injecting, try @view.inject()`)
        }
        assertUndefined(parent, key)
        result[key] = injections[key]
      }
      const provide = provides[key]
      // attach object
      if (provide instanceof Object) {
        for (const subKey of Object.keys(provide)) {
          assertUndefined(parent, subKey)
          result[subKey] = provide[subKey]
        }
      }
    }
    return result
  }

  // attach object to class
  const attachProvides = (Klass, provisions) => {
    const provides = getProvides(Klass, provisions)
    Object.keys(provides).forEach(key => {
      Object.defineProperty(Klass.prototype, key, {
        get: function() { return provides[key] }
      })
    })
    return view(Klass)
  }

  view.provide = (...list) => moduleOrComponent => {
    const isReactClass = typeof moduleOrComponent === 'function'
    return isReactClass
      ? view(moduleOrComponent)
      // nest one more layer if we have motion-hmr transform
      : Klass => attachProvides(Klass, list)
  }

  return view
}
