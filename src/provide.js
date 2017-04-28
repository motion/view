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
      @observable _props = {}

      constructor(props) {
        super(props)

        this._props = props

        // either func=>object or object
        const isFunction = typeof provided === 'function'
        let stores

        // function => object
        if (isFunction) {
          stores = provided(this.props)
        } else {
          // classes
          stores = Object.keys(provided).reduce((acc, cur) => {
            const Store = provided[cur]

            // provide observable props
            if (!Store.prototype.props) {
              Object.defineProperty(Store.prototype, 'props', {
                get: () => this._props,
              })
            }

            const store = new Store(this.props)

            return {
              ...acc,
              [cur]: store,
            }
          }, {})
        }

        this.state = {
          stores: cache.restore(this, stores, extModule),
        }

        if (extModule && extModule.hot) {
          extModule.hot.dispose(data => {
            data.stores = this.state.stores
          })
        }
      }

      componentWillReceiveProps(nextProps) {
        this._props = nextProps
      }

      componentWillMount() {
        // start stores
        Object.keys(this.state.stores).forEach(name => {
          const store = this.state.stores[name]

          // auto observable stuff
          Object.keys(store).forEach(key => {
            const val = store[key]

            // idea: to make current automatic
            if (val && val.$ && typeof val.current !== 'undefined') {
              // totally nuts, this make it auto return the current observable
              Object.defineProperty(store, key, {
                get: () => val.current,
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
