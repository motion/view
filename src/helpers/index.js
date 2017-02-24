export function assertUndefined(parent, key) {
  if (typeof parent[key] !== 'undefined') {
    throw new Error(`Error, cannot overwrite existing property on class: ${key}`)
  }
}

export function once(fn) {
  if (fn.__hasBeenCalled) return _ => _
  fn.__hasBeenCalled = true
  return fn
}
