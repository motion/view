export const addStoreHMR = Klass => {
  console.log('decroate', Klass)
  class StoreHMRProxy extends Klass {
    constructor(...args) {
      console.log('do it')
      super(...args)
      // stores
      if (provided) {
        this.attachStores(provided)
      }
    }

    testit() {
      console.log('test')
    }
  }

  return StoreHMRProxy
}
