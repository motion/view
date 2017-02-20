const idFn = _ => _

export default class StoreCache {
  constructor() {
    this.cache = {}
  }
  update(module, provided) {
    this.cache[module.id] = this.getCached(module, provided)
  }
  restore(...args) {
    return this.getStores(...args)
  }

  // private

  getCached(module, provided): Object<string, Store> {
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

  getStores(instance, provided, module) {
    const storeNames = Object.keys(provided)
    let previous = {}
    if (module && module.hot) {
      previous = this.getPrevious(instance, module)
      this.saveProvided(instance, storeNames, module)
    }
    return storeNames.map(key => {
      const store = previous[key] || provided[key]
      return { key, store }
    })
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

  saveProvided(instance, storeNames, module) {
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
}
