export function assertUndefined(parent, key) {
  if (typeof parent[key] !== 'undefined') {
    throw new Error(`Error, cannot overwrite existing property on class: ${key}`)
  }
}
