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

export function patch(View, name, ...methods) {
  const original = View.prototype[name]
  View.prototype[name] = function(...args) {
    for (const method of methods) {
      if (!method) continue
      method.apply(this, args)
    }
    original && original.apply(this, args)
  }
}
