const buildDepsTree = require('../../src')
const log = require('debug')('bin')
const fetchPkg = require('package-json')

module.exports = async ({ name, version = 'latest', options = {} }) => {
  log('build deps tree for %s@%s with options %o', name, version, options)

  const pkg = await fetchPkg(name, { version })
  const { scope } = options

  if (scope) {
    options.filter = buildDepsTree.filters.scope(scope)
  }

  return buildDepsTree(pkg, options)
}
