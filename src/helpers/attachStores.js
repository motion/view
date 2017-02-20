import { CompositeDisposable } from 'sb-event-kit'
import StoreCache from './storeCache'
import { PROVIDED_KEY } from '../constants'

export default function createHelper(options: Object) {
  const Cache = new StoreCache()

  if (options.onHMR) {
    options.onHMR(Cache)
  }

  function attachStores(self, provided: Object<string, Store>) {
    const { storeKey } = self.props
    const key = storeKey ? `${component.name}${storeKey}` : null

    // attach stores
    const stores = Cache.restore(self, provided, module, options)

    for (const { key, store } of stores) {
      // attach store directly to instance
      if (self[key]) {
        throw new Error(`Cannot set store to ${key}, component already has that defined: ${self[key]}`)
        continue
      }
      if (store.constructor) {
        self[key] = options.onStoreCreate(new store(self.props))
      }
      else {
        // restore from hmr
        self[key] = store
      }
      // for debug, TODO: attach to a dev injection space, prevent name collision
      if (self.app && self.app.stores) {
        self.app.stores[key] = store
      }
    }
    // create subscriptions if not exists
    if (!self.subscriptions) {
      self.subscriptions = new CompositeDisposable()
    }
    // add dispose subscription
    self.subscriptions.add(() => {
      stores.forEach(({ store }) => {
        if (store.dispose) {
          store.dispose()
        }
      })
    })
  }

  return {
    Cache,
    componentWillMount() {
      if (this[PROVIDED_KEY]) {
        attachStores(this, this[PROVIDED_KEY])
      }
    }
  }
}
