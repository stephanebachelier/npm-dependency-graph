const buildDepsTree = require('../../src')
const log = require('debug')('bin')
const fetchPkg = require('package-json')

module.exports = async ({ name, version = 'latest', options = {} }) => {
  log('build deps tree for %s@%s with options %o', name, version, options)
  const pkgInfos = { name, version }

  const versionIdx = name.lastIndexOf('@')

  if (versionIdx > 0) {
    pkgInfos.name = name.substring(0, versionIdx)
    pkgInfos.version = name.substring(versionIdx + 1)
  }

  const pkg = await fetchPkg(pkgInfos.name, { version: pkgInfos.version })
  const { scope } = options

  if (scope) {
    options.filter = buildDepsTree.filters.scope(scope)
  }

  return buildDepsTree(pkg, options)
}
