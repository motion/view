import { PROVIDED_KEY, DEV_MODE } from '../constants'
import { assertUndefined } from './index'

function attachToClass(Klass, provides) {
  Object.defineProperty(Klass.prototype, PROVIDED_KEY, {
    get: function() { return provides }
  })
  return Klass
}

const idFn = _ => _

export default (decorator = idFn, options) => {
  return function provide(provides) {
    // handles our custom hmr transform which adds module fn
    return (maybeModule: Class | Object) => {
      function finish(Klass, module) {
        if (options.onProvide) {
          options.onProvide(Klass, provides, module)
        }
        return decorator(attachToClass(Klass, provides), options)
      }
      // without hmr transform
      if (typeof maybeModule === 'function') {
        return finish(maybeModule)
      }
      // with hmr transform
      return Klass => finish(Klass, maybeModule)
    }
  }
}
