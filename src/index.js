import Cache from './cache'
import { CompositeDisposable } from 'sb-event-kit'
import { HMR_KEY } from './constants'
import { once, assertUndefined } from './helpers'

const cache = new Cache()
const injections = {}

export function inject(things: Object) {
  for (const key of Object.keys(things)) {
    assertUndefined(injections, key)
    injections[key] = { get: () => things[key] }
  }
}

export function injectDecorate(Klass) {
  Object.defineProperties(Klass.prototype, injections)
  return Klass
}

export function provide(things) {
  const keys = Object.keys(things)

  return (Klass) => extModule => {
    cache.revive(extModule, things)

    class Provider extends React.Element {
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
  }
}

