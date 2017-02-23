import { HMR_KEY } from '../constants'

const idFn = _ => _

export default class StoreCache {
  constructor() {
    this.cache = {}
  }
  revive(module, provides) {
    this.cache[module.id] = this.getCached(module, provides)
  }
  fetch(instance, provided, module) {
    const storeNames = Object.keys(provided)
    let previous = {}
    if (module && module.hot) {
      previous = this.getPrevious(instance, module)
    }
    return storeNames.map(key => {
      const store = previous[key] || provided[key]
      return { key, store }
    })
  }

  // private

  getCached(module, provides): Object<string, Store> {
    console.log('getting data', module.hot.data)
    const { stores } = module.hot.data
    let result = {}
    if (stores) {
      const storeNames = Object.keys(stores)
      for (const key of storeNames) {
        const store = stores[key]
        // if (provides[key].HMR_ID === store.HMR_ID) {
          result[key] = store
        // }
      }
    }
    return result
  }

  getPrevious(instance, module) {
    const result = {}
    if (!module || !module.hot) {
      return result
    }
    // restore
    if (this.cache[module.id]) {
      const cached = this.cache[module.id]
      if (cached._isKeyed_) {
        Object.assign(result, cached[instance.props.storeKey])
      }
      else {
        Object.assign(result, cached)
      }
    }
    return result
  }

  createDisposer(onDispose, provides) {
    return function disposer() {
      onDispose(data => {
        data.stores = data.stores || {}
        const names = Object.keys(provides)
        for (const name of names) {
          const store = this[name]
          if (!store) {
            continue
          }
          store[HMR_KEY] = true
          // allow restore of storeKey'ed stores
          if (this.props.storeKey) {
            data.stores[name] = data.stores[name] || { _isKeyed_: true }
            data.stores[name][this.props.storeKey] = store
          }
          else {
            data.stores[name] = store
          }
        }
      })
    }
  }
}
