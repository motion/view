import { assertUndefined } from './index'

const idFn = _ => _

// simple class injector
export default function createInject() {
  const injections = {}

  function inject(injection: Object) {
    // add
    Object.keys(injection).forEach(k => {
      // TODO hmr complains
      // assertUndefined(injections, k)
      injections[k] = { get: () => injection[k] }
    })
    return true
  }

  function injectDecorate(Klass) {
    Object.defineProperties(Klass.prototype, injections)
    return Klass
  }

  return {
    injections,
    inject,
    injectDecorate,
  }
}
