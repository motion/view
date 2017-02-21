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
  const cachePersist = function() { persist.call(this) }
  let persist = _ => _

  let pmodule

  if (module && module.hot) {
    options.onProvide = once((Klass, provides, module) => {
      pmodule = module
      Cache.revive(pmodule, provides)
      const onDispose = pmodule.hot.dispose.bind(pmodule.hot)
      persist = Cache.createDisposer(onDispose, provides)
    })
  }

  function componentWillMount() {
    const provided = this[PROVIDED_KEY]
    if (provided) {
      // attach stores
      const stores = Cache.fetch(this, provided, pmodule)
      attachStores.call(this, stores, options, pmodule)
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
    cachePersist,
    provide,
    inject,
    Cache,
  }
}
