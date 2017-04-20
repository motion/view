import React from 'react'
import Cache from './cache'

const cache = new Cache()

export default function provide(provided, extModule) {
  return Klass => {
    if (extModule) {
      cache.revive(extModule, provided)
    }

    class Provider extends React.Component {
      constructor(props) {
        super(props)

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
            return {
              ...acc,
              [cur]: new Store(this.props),
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
