const log = require('debug')('tree')
const negate = require('lodash/negate')

const { parseTree, parseDep } = require('./helper')

const scope = name => dep => dep.startsWith(name)

scope.not = name => negate(scope(name))

const buildDepsTree = async (pkg, options = {}) => {
  log('build deps tree for %s@%s', pkg.name, pkg.version)
  const { filter } = options

  return parseTree(
    pkg,
    {
      ...options,
      parse: parseDep(filter)
    },
    0
  )
}

module.exports = buildDepsTree

module.exports.filters = {
  scope
}
