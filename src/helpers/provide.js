import { PROVIDED_KEY, DEV_MODE } from '../constants'
import { assertUndefined } from './index'

// collect injections + objects for provide
function getProvides(parent: Class<T>, provides: Object): Object {
  const result = {}
  for (const key of Object.keys(provides)) {
    assertUndefined(parent, key)
    result[key] = provides[key]
  }
  return result
}

// attach objects to class
function attachProvides(Klass, provides) {
  Object.defineProperty(Klass.prototype, PROVIDED_KEY, {
    get: function() { return provides }
  })
  return Klass
}

const idFn = _ => _

// attach stores to current view
export default function createProvide(decorator = idFn, options) {
  return function provide(provides) {
    // handles our custom hmr transform which adds module fn
    return (maybeModule: Class | Object) => {
      const res = (Klass, module) => {
        if (options.onProvide) {
          options.onProvide(Klass, provides, module)
        }
        return decorator(attachProvides(Klass, provides), options)
      }
      // without hmr transform
      if (typeof maybeModule === 'function') {
        return res(maybeModule)
      }
      // with hmr transform
      return Klass => res(Klass, maybeModule)
    }
  }
}
