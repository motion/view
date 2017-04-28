import React from 'react'
import Cache from './cache'
import { observable, extendShallowObservable, isObservable } from 'mobx'

const cache = new Cache()

export default function provide(provided, extModule) {
  return Klass => {
    if (extModule) {
      cache.revive(extModule, provided)
    }

    class Provider extends React.Component {
      @observable.ref _props = this.props

      componentWillReceiveProps(nextProps) {
        this._props = nextProps
      }

      componentWillMount() {
        const getProps = {
          get: () => this._props,
          set: () => {},
          configurable: true,
        }

        // start stores
        const stores = Object.keys(provided).reduce((acc, cur) => {
          const Store = provided[cur]

          function ProxyStore(...args) {
            Object.defineProperty(Store.prototype, 'props', getProps)
            this.store = new Store(...args)
            Object.defineProperty(this.store, 'props', getProps)
            return this.store
          }

          const store = new ProxyStore(this.props)

          return {
            ...acc,
            [cur]: store,
          }
        }, {})

        this.state = {
          stores: cache.restore(this, stores, extModule),
        }

        if (extModule && extModule.hot) {
          extModule.hot.dispose(data => {
            data.stores = this.state.stores
          })
        }

        // start stores
        Object.keys(this.state.stores).forEach(name => {
          const store = this.state.stores[name]

          // auto observable stuff
          Object.keys(store).forEach(key => {
            const val = store[key]

            if (val && val.$isQuery) {
              // totally nuts, this make it auto return the current observable
              Object.defineProperty(store, key, {
                get: () => {
                  return val.current
                },
              })
            } else if (typeof val !== 'function' && !isObservable(val)) {
              extendShallowObservable(store, { [key]: val })
            }
          })

          if (store.start) {
            store.start.call(store, this.props)
          }
        })
      }

      componentWillUnmount() {
        Object.keys(this.state.stores).forEach(key => {
          const { dispose } = this.state.stores[key]
          dispose && dispose()
        })
      }

      render() {
        return <Klass {...this.props} {...this.state.stores} />
      }
    }

    return Provider
  }
}
