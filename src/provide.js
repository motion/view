import React from 'react'
import Cache from './cache'

const cache = new Cache()

export default function provide(things, extModule) {
  const keys = Object.keys(things)
  return Klass => {
    cache.revive(extModule, things)

    class Provider extends React.Component {
      state = {
        stores: keys.reduce((rest, key) => ({ [key]: null, ...rest }), {})
      }

      componentWillMount() {
        this.setState({
          stores: cache.restore(this, things, extModule)
        })

        if (extModule && extModule.hot) {
          extModule.hot.dispose(data => {
            data.stores = this.state.stores
          })
        }
      }

      componentWillUnmount() {
        Object.keys(this.state.stores).forEach(key => {
          this.state.stores[key].dispose()
        })
      }

      render() {
        return <Klass {...this.props} {...this.state.stores} />
      }
    }

    return Provider
  }
}

