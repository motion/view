import { assertUndefined } from './index'

const idFn = _ => _

// simple class injector
export default function createInject(viewDecorator = idFn) {
  const injections = {}

  return function inject(injection: Object) {
    // add
    Object.keys(injection).forEach(k => {
      // TODO hmr complains
      // assertUndefined(injections, k)
      injections[k] = { get: () => injection[k] }
    })

    return Klass => {
      Object.defineProperties(Klass.prototype, injections)
      return viewDecorator(Klass)
    }
  }
}
