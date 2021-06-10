const log = require('debug')('tree')
const negate = require('lodash/negate')
const get = require('lodash/get')
const { parseTree, parseDep } = require('./helper/walk')
const { buildOutput } = require('./helper/output')

const scope = name => {
  if (!name.startsWith('!')) {
    return dep => dep.startsWith(name)
  }

  const needle = name.substr(1)

  return negate(dep => dep.startsWith(needle))
}

const buildDepsTree = async (pkg, options = {}) => {
  log('build deps tree for %s@%s', pkg.name, pkg.version)
  const { filter } = options

  const tree = await parseTree(
    pkg,
    {
      ...options,
      parse: parseDep(filter)
    },
    0
  )

  await buildOutput(pkg, tree, {
    output: get(options, 'output', 'json'),
    label: get(options, 'label', 'name'),
    name: get(options, 'name')
  })
}

module.exports = buildDepsTree

module.exports.filters = {
  scope
}
