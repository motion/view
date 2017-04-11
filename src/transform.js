// babel transform to pass in module/file automatically
const storeSymbol = Symbol('motion unique store')
const viewSymbol = Symbol('motion unique component')

let uid = 0

function transform({ types: t }: { types: Object }): Object {
  return {
    name: 'motion-view-hmr',
    visitor: {
      CallExpression(path, state) {
        const { node } = path

        if (t.isMemberExpression(node.callee) && node.callee.property.name === 'provide') {
          if (node[viewSymbol]) {
            return
          }
          node[viewSymbol] = true
          node.arguments.push(t.identifier('module'))
        }
      },
    },
  }
}

module.exports = transform
