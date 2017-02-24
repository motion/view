import Cache from './cache'
import { CompositeDisposable } from 'sb-event-kit'
import { HMR_KEY } from './constants'
import { once } from './helpers'

const Provides = new Cache()

export function provide(things) {
  const keys = Object.keys(things)

  return (Klass, moodule) => {
    Provides.revive(moodule, things)

    class Provider extends React.Element {
      state = {
        stores: keys.reduce((rest, key) => ({ [key]: null, ...rest }), {})
      }

      componentWillMount() {
        this.setState({
          stores: Provides.restore(this, things, moodule)
        })

        if (moodule && moodule.hot) {
          moodule.hot.dispose(data => {
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

