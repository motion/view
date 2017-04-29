import React from 'react'
import Cache from './cache'
import { observable } from 'mobx'

export default function createProvide(options) {
  console.log('opts', options)
  const { mobx } = options
  const cache = new Cache()

  return function provide(provided, extModule) {
    return Klass => {
      if (extModule) {
        cache.revive(extModule, provided)
      }

      if (options.storeDecorator && provided) {
        for (const key of Object.keys(provided)) {
          provided[key] = options.storeDecorator(provided[key])
        }
      }

      class Provider extends React.Component {
        componentWillReceiveProps(nextProps) {
          this._props = nextProps
        }

        componentWillMount() {
          // for reactive props in stores
          if (mobx) {
            mobx.extendShallowObservable(this, { _props: this.props })
          } else {
            this._props = this.props
          }

          const getProps = {
            get: () => this._props,
            set: () => {},
            configurable: true,
          }

          // start stores
          let stores = Object.keys(provided).reduce((acc, cur) => {
            const Store = provided[cur]

            function createStore() {
              Object.defineProperty(Store.prototype, 'props', getProps)
              const store = new Store()
              Object.defineProperty(store, 'props', getProps)
              return store
            }

            return {
              ...acc,
              [cur]: createStore(),
            }
          }, {})

          if (extModule && extModule.hot) {
            extModule.hot.dispose(data => {
              data.stores = this.state.stores
            })
          }

          // optional mount function
          if (options.onStoreMount) {
            for (const name of Object.keys(stores)) {
              // fallback to store if nothing returned
              stores[name] =
                options.onStoreMount(name, stores[name], this.props) ||
                stores[name]
            }
          }

          this.state = {
            stores: cache.restore(this, stores, extModule),
          }
        }

        componentWillUnmount() {
          if (options.onStoreUnmount) {
            for (const name of Object.keys(this.state.stores)) {
              options.onStoreUnmount(name, this.state.stores[name])
            }
          }
        }

        render() {
          return <Klass {...this.props} {...this.state.stores} />
        }
      }

      return Provider
    }
  }
}
