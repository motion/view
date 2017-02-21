import StoreCache from './helpers/storeCache'
import attachStores from './helpers/attachStores'
import provide from './helpers/provide'
import inject from './helpers/inject'
import { PROVIDED_KEY } from './constants'
import { patch, once } from './helpers'

const defaultOptions = {
  onStoreCreate: _ => _,
}

export default function motionView(options = defaultOptions) {
  const Cache = new StoreCache()
  let cachePersist

  if (module && module.hot) {
    const onDispose = module.hot.dispose.bind(module.hot)
    options.onProvide = once((instance, provides) => {
      Cache.revive(module, provides)
      cachePersist = Cache.createDisposer(onDispose, provides)
    })
  }

  function componentWillMount() {
    const provided = this[PROVIDED_KEY]
    if (provided) {
      // attach stores
      console.log('fetch', this)
      const stores = Cache.fetch(this, provided, module)
      attachStores.call(this, stores, options, module)
    }
  }

  // helper to automate some boilerplate
  function decorator(fn) {
    function view(View) {
      patch(View, 'componentWillMount', componentWillMount, cachePersist)
      return fn(View)
    }
    view.provide = provide(view, options)
    view.inject = inject(view, options)
    return view
  }

  return {
    decorator,
    componentWillMount,
    provide,
    inject,
    Cache,
  }
}
