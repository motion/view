import StoreCache from './helpers/storeCache'
import attachStores from './helpers/attachStores'
import createProvide from './helpers/provide'
import createInject from './helpers/inject'
import { PROVIDED_KEY } from './constants'
import { patch, once } from './helpers'

const defaultOptions = {
  onStoreCreate: _ => _,
}

export default function motionView(userDecorator: Function, options = defaultOptions) {
  const Cache = new StoreCache()
  const cachePersist = function() { persist.call(this) }
  let persist = _ => _

  let currentModule

  if (module && module.hot) {
    options.onProvide = once((Klass, provides, module) => {
      currentModule = module
      Cache.revive(currentModule, provides)
      const onDispose = currentModule.hot.dispose.bind(currentModule.hot)
      persist = Cache.createDisposer(onDispose, provides)
    })
  }

  function componentWillMount() {
    const provided = this[PROVIDED_KEY]
    if (provided) {
      // attach stores
      const stores = Cache.fetch(this, provided, currentModule)
      attachStores.call(this, stores, options, currentModule)
    }
  }

  // inject decorator
  const { inject, injectDecorate } = createInject()

  // helper to automate some boilerplate
  function view(View) {
    if (typeof View === 'function') {
      patch(View, 'componentWillMount', componentWillMount, cachePersist)
    }
    return injectDecorate(userDecorator(View))
  }

  // add provide
  view.provide = createProvide(view, options)
  // add inject
  view.inject =  inject
  view.injectDecorate = injectDecorate

  return view
}
