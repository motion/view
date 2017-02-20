import attachStores from './helpers/attachStores'
import provide from './helpers/provide'
import inject from './helpers/inject'

const defaultOptions = {
  onStoreCreate: _ => _,
}

export default function motionView(options = defaultOptions) {
  const { Cache, componentWillMount } = attachStores(options)

  if (module && module.hot) {
    Cache.update(module, options.provided)
  }

  // helper to automate some boilerplate
  function decorator(fn) {
    function view(View) {
      const originalMount = View.prototype.componentWillMount
      View.prototype.componentWillMount = function(...args) {
        // hmr componentWillMount, then original
        componentWillMount.apply(this, args)
        originalMount && originalMount.apply(this, args)
      }
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
