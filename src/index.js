import { CompositeDisposable } from 'sb-event-kit'
import StoreCache from './helpers/storeCache'
import attachStores from './helpers/attachStores'
import createInject from './helpers/inject'
import provide from './helpers/provide'
import inject from './helpers/inject'
import { PROVIDED_KEY } from './constants'

const defaultOptions = {
  onStoreCreate: _ => _,
}

export default function view(options = defaultOptions) {
  const Cache = new StoreCache()

  if (options.onHMR) {
    options.onHMR(Cache)
  }

  return {
    provide,
    inject,
  }
}

export function componentWillMount() {
  if (this[PROVIDED_KEY]) {
    attachStores(this, this[PROVIDED_KEY])
  }
}
