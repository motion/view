import { CompositeDisposable } from 'sb-event-kit'
import { HMR_KEY } from '../constants'

export default function attachStores(stores, options, module) {
  const { storeKey } = this.props
  const key = storeKey ? `${component.name}${storeKey}` : null

  for (const { key, store } of stores) {
    // attach store directly to instance
    if (this[key]) {
      throw new Error(`Cannot set store to ${key}, component already has that defined: ${this[key]}`)
      continue
    }
    if (store[HMR_KEY]) {
      // restore from hmr
      this[key] = store
    }
    else {
      // instantiate
      this[key] = options.onStoreCreate(new store(this.props))
    }
    // for debug, TODO: attach to a dev injection space, prevent name collision
    if (this.app && this.app.stores) {
      this.app.stores[key] = store
    }
  }
  // create subscriptions if not exists
  if (!this.subscriptions) {
    this.subscriptions = new CompositeDisposable()
  }
  // add dispose subscription
  this.subscriptions.add(() => {
    stores.forEach(({ store }) => {
      if (store.dispose) {
        store.dispose()
      }
    })
  })
}
