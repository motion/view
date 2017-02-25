import { assertUndefined } from './helpers'

const injections = {}

export function inject(things: Object) {
  for (const key of Object.keys(things)) {
    assertUndefined(injections, key)
    injections[key] = { get: () => things[key] }
  }
}

export function injectDecorate(Klass) {
  Object.defineProperties(Klass.prototype, injections)
  return Klass
}

export { default as provide } from './provide'
