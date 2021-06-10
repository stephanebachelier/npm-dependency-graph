const buildDepsTree = require('../../src')
const log = require('debug')('bin')
const fetchPkg = require('package-json')
const constant = require('lodash/constant')

module.exports = async ({ name, version = 'latest', options = {} }) => {
  log('build deps tree for %s with options %o', name, options)
  const pkgInfos = { name, version }

  const versionIdx = name.lastIndexOf('@')

  if (versionIdx > 0) {
    pkgInfos.name = name.substring(0, versionIdx)
    pkgInfos.version = name.substring(versionIdx + 1)
  }

  log('fetch pkg %o', pkgInfos)

  const pkg = await fetchPkg(pkgInfos.name, { version: pkgInfos.version })
  const { scope } = options

  options.filter = scope ? buildDepsTree.filters.scope(scope) : constant(true)

  return buildDepsTree(pkg, options)
}
