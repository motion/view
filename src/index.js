import attachStores from './helpers/attachStores'
import provide from './helpers/provide'
import inject from './helpers/inject'

const defaultOptions = {
  onStoreCreate: _ => _,
}

export default function view(options = defaultOptions) {
  const { componentWillMount } = attachStores(options)
  return {
    provide,
    inject,
    componentWillMount,
  }
}
