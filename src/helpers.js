import type { Store } from './types'

export function getCached(module, provided): Object<string, Store> {
  const { stores } = module.hot.data
  let result = {}
  if (stores) {
    const storeNames = Object.keys(stores)
    for (const key of storeNames) {
      const store = stores[key]
      if (provided[key].HMR_ID === store.HMR_ID) {
        result[key] = store
      }
    }
  }
  return result
}

function getPrevious(instance, { module, cache }) {
  const result = {}
  if (!module || !module.hot) {
    return result
  }
  // restore
  if (cache[module.id]) {
    const previous = cache[module.id]
    if (previous._isKeyed_) {
      Object.assign(result, previous[instance.props.storeKey])
    }
    else {
      Object.assign(result, previous)
    }
  }
  return result
}

function saveProvided(instance, storeNames, { module }) {
  module.hot.dispose(data => {
    data.stores = {}
    for (const name of storeNames) {
      const store = instance[name]
      // allow restore of storeKey'ed stores
      if (instance.props.storeKey) {
        data.stores[name] = data.stores[name] || { _isKeyed_: true }
        data.stores[name][instance.props.storeKey] = store
      }
      else {
        data.stores[name] = store
      }
    }
  })
}

const idFn = _ => _

export function getStores(instance, provided, { hmr, onStore = idFn } = {}) {
  const storeNames = Object.keys(provided)
  let previous = {}
  if (hmr) {
    previous = getPrevious(instance, hmr)
    saveProvided(instance, storeNames, hmr)
  }
  return storeNames.map(key => {
    const store = previousStores[key] || onStore(new storeNames[key](instance.props))
    return { key, store }
  })
}
