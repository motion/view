import browser from 'detect-browser'
import { observer } from 'mobx-react'
import { observable } from 'mobx'
import classHelpers, { CompositeDisposable } from 'macro-class-helpers'
import mobxClassHelpers from 'mobx-class-helpers'
import React from 'react'
import { baseStyles } from 'macro-theme'
import gloss from 'gloss'
import { create } from 'mobx-persist'
import developmentDecorate from './devDecorate'
import type AwesomeReactClass from './types'
import { getCached, getStores } from './helpers'

export const val = observable
export * from 'mobx'

const persistStore = create({})
const styled = gloss({ baseStyles })
const cache = {}
const injections = {}

function view(component: ReactClass<{}>, providedStores: ?Object = null, module?: Object, plain?: boolean): AwesomeReactClass {
  // hmr restore
  if (module && module.hot) {
    cache[module.id] = getCached(module, providedStores))
  }

  class ProxyComponent {
    constructor() {
      this.subscriptions = new CompositeDisposable()

      // inherit from React.Component
      React.Component.apply(this, arguments)
      component.apply(this, arguments)

      if (providedStores) {
        this.attachStores()
      }
    }

    attachStores() {
      const stores = getStores(this, providedStores, {
        hmr: { module, cache },
        onStore: store => {
          if (this.props.storeKey) {
            // add mobx-persist
            const storeKey = `${component.name}${this.props.storeKey}`
            store = persistStore(storeKey, store)
          }
          return store
        }
      )
      this.stores = new Set()
      for (const [key, store] of stores) {
        if (instance[key]) {
          throw new Error(`Cannot set store to ${key}, component already has that defined: ${instance[key]}`)
        }
        this[key] = store
        this.stores.add({ key, store })
        this.app.stores[key] = store // for debug, TODO prevent name collision
      }
      // dispose stores
      this.subscriptions.add(() => {
        this.stores.forEach(({ store }) => store.dispose())
      })
    }

    componentWillUnmount() {
      this.subscriptions.dispose()
      if (component.prototype.componentWillUnmount) {
        component.prototype.componentWillUnmount.call(this)
      }
    }

    // allow dependency injection into all classes, with some safety
    inject(key, val) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`Can't defined ${key} onto class ${this.name}, already defined to ${this[key]}`)
      }

      injections[key] = val
      Object.defineProperty(this, key, {
        get: () => injections[key]
      })
    }

    // render gets params
    render() {
      return super.render(this.props, this.state, this.context)
    }
  }

  // set static properties
  Object.keys(component).forEach(staticProp => {
    ProxyComponent[staticProp] = component[staticProp]
  })

  // class helpers
  classHelpers(
    ProxyComponent,
    'ref',
    'addEvent',
    'setTimeout',
    'setInterval',
    'createCompositeDisposable'
  )

  // mobx class helpers
  mobxClassHelpers(
    ProxyComponent,
    'react',
    'watch'
  )

  // inherent properties
  Object.setPrototypeOf(component.prototype, React.Component.prototype)
  Object.setPrototypeOf(ProxyComponent.prototype, component.prototype)

  // wrap styled + observer
  // be sure to keep styled outside observer
  const decoratedComp = plain ?
    styled(ProxyComponent) :
    styled(observer(ProxyComponent))

  if (browser.name !== 'safari') {
    Object.defineProperty(decoratedComp, 'name', {
      value: component.name,
    })
  }

  if (process.env.NODE_ENV === "development") {
    developmentDecorate(ProxyComponent)
  }

  return decoratedComp
}

view.provide = provided => module => component => view(component, provided, module)
view.plain = component => view(component, false, false, true)

export default view
