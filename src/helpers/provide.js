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
function attachProvides(Klass, provisions: Array<Object>) {
  const provides = getProvides(Klass, provisions)
  Object.defineProperty(Klass.prototype, PROVIDED_KEY, {
    get: function() { return provides }
  })
}

const idFn = _ => _

// attach stores to current view
export default function createProvide(viewDecorator = idFn) {
  return function provide(...list) {
    // handles our custom hmr transform which adds module
    return moduleOrComponent => {
      const isReactClass = typeof moduleOrComponent === 'function'
      if (isReactClass) {
        return viewDecorator(moduleOrComponent)
      }
      // nest one more fn, via motion-hmr transform
      return Klass => viewDecorator(attachProvides(Klass, list))
    }
  }
}
