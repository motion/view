// babel transform to pass in module/file automatically
const storeSymbol = Symbol('motion unique store')
const componentSymbol = Symbol('motion unique component')

let uid = 0

export default function({ types: t }: { types: Object }): Object {
  return {
    name: 'motion-view-hmr',
    visitor: {
      CallExpression(path, state) {
        const { node } = path

        if (t.isMemberExpression(node.callee) && node.callee.property.name === 'provide') {
          if (node[componentSymbol]) {
            return
          }
          node[componentSymbol] = true
          console.log(path.node)
          path.replaceWith(
            t.callExpression(
              path.node,
              [t.identifier('module')]
            )
          )
        }
        else if (node.callee.name === 'store' && node.arguments.length === 1) {
          const firstArgument = node.arguments[0]
          if (firstArgument.type !== 'AssignmentExpression') {
            return
          }
          if (node[storeSymbol]) {
            return
          }
          node[storeSymbol] = true
          node.arguments.push(t.numericLiteral(++uid % Number.MAX_SAFE_INTEGER))
        }
      },
    },
  }
}
