import { PROVIDED_KEY, DEV_MODE } from '../constants'
import { assertUndefined } from './index'

// collect injections + objects for provide
function getProvides(parent: Class<T>, provides: Array<Object | string>): Object {
  const result = {}
  for (const key of provides) {
    // attach object
    const provide = key
    if (provide instanceof Object) {
      for (const subKey of Object.keys(provide)) {
        assertUndefined(parent, subKey)
        result[subKey] = provide[subKey]
      }
    }
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
  console.log(decorator, options)
  return function provide(...list) {
    // handles our custom hmr transform which adds module
    return moduleOrKlass => {
      const res = Klass => {
        const provides = getProvides(Klass, list)
        const opts = { provides, ...options }
        decorator(attachProvides(Klass, provides), opts)
      }
      // without hmr transform
      if (typeof moduleOrKlass === 'function') {
        return res(moduleOrKlass)
      }
      // with hmr transform
      return res
    }
  }
}
