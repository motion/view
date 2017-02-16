import browser from 'detect-browser'
import { observer } from 'mobx-react'
import { observable } from 'mobx'
import classHelpers, { CompositeDisposable } from 'macro-class-helpers'
import mobxClassHelpers from 'mobx-class-helpers'
import React from 'react'
import { baseStyles } from 'macro-theme'
import gloss from 'gloss'
import developmentDecorate from './devDecorate'
import type { AwesomeReactClass, Store } from './types'
import { getCached, getStores, persistStore } from './helpers'

export const val = observable
export * from 'mobx'

const styled = gloss({ baseStyles })
// for store hmr
const cache = {}
// for dependency injection
const injections = {}

// @view decorator
function view(
  component: ReactClass<{}>,
  provided: ?Object = null,
  module?: Object, plain?: boolean
): AwesomeReactClass {
  // hmr restore
  if (module && module.hot) {
    cache[module.id] = getCached(module, provided))
  }

  class ProxyComponent {
    constructor() {
      this.subscriptions = new CompositeDisposable()
      // inherit from React.Component
      React.Component.apply(this, arguments)
      component.apply(this, arguments)
      // stores
      if (provided) {
        this.attachStores(provided)
      }
    }

    // attaches stores provided to this instance
    attachStores(provided: Object<string, Store>) {
      const { storeKey } = this.props
      const key = storeKey ? `${component.name}${storeKey}` : null
      this.stores = getStores(this, provided, {
        hmr: { module, cache },
        onStore: store => persistStore(key, store)
      )
      for (const { key, store } of this.stores) {
        // attach store directly to instance
        if (this[key]) {
          throw new Error(`Cannot set store to ${key}, component already has that defined: ${this[key]}`)
        }
        this[key] = store
        // for debug, TODO: attach to a dev injection space, prevent name collision
        if (this.app) {
          this.app.stores[key] = store
        }
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
      Object.defineProperty(this, key, { get: () => injections[key] })
    }

    // render gets params
    render() {
      return super.render(this.props, this.state, this.context)
    }
  }

  // proxy static properties
  Object.keys(component).forEach(staticProp => {
    ProxyComponent[staticProp] = component[staticProp]
  })

  // inherit class helpers
  classHelpers(
    ProxyComponent,
    'ref',
    'addEvent',
    'setTimeout',
    'setInterval',
    'createCompositeDisposable'
  )

  // inherit mobx class helpers
  mobxClassHelpers(
    ProxyComponent,
    'react',
    'watch'
  )

  // inherit classes
  Object.setPrototypeOf(component.prototype, React.Component.prototype)
  Object.setPrototypeOf(ProxyComponent.prototype, component.prototype)

  // add name
  if (browser.name !== 'safari') {
    Object.defineProperty(ProxyComponent, 'name', {
      value: component.name,
    })
  }

  if (process.env.NODE_ENV === "development") {
    developmentDecorate(ProxyComponent)
  }

  return plain ?
    styled(ProxyComponent) :
    styled(observer(ProxyComponent))
}

view.provide = provided => module => component => view(component, provided, module)
view.plain = component => view(component, false, false, true)

export default view
