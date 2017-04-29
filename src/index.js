import createProvide from './provide'

export default function createViewDecorator(options = {}) {
  return createProvide(options)
}
