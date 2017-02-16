import { create } from 'mobx-persist'

const decoratePersist = create({})

export function persistStore(key, store) {
  return key ? decoratePersist(key, store) : store
}
