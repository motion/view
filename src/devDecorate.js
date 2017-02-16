const LIFECYCLES = [
  'componentWillMount',
  'componentDidMount',
  'componentWillUpdate',
  'componentDidUpdate',
  'componentWillReceiveProps',
]

export default function(ProxyComponent) {
  for (const key of LIFECYCLES) {
    if (ProxyComponent[key]) {
      console.log('proxy', ProxyComponent.name, key)
    }
  }
}
