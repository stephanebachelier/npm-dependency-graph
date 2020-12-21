const fetchPkg = require('package-json')
const toPairs = require('lodash/toPairs')
const fromPairs = require('lodash/fromPairs')
const compact = require('lodash/compact')
const isUndefined = require('lodash/isUndefined')
const kebabCase = require('lodash/kebabCase')
const negate = require('lodash/negate')
const flattenDeep = require('lodash/flattenDeep')
const sortBy = require('lodash/sortBy')
const fs = require('fs-extra')

const debug = require('debug')
const log = {
  tree: debug('tree'),
  parse: debug('parse'),
  deps: debug('deps'),
  walk: (type, depth) => debug(`walk:${type}:${depth}`)
}

const scope = name => dep => dep.startsWith(name)

scope.not = name => negate(scope(name))

const applyFilter = (name, filter) => filter(name)

const filterDeps = (deps, filter) =>
  fromPairs(
    compact(
      toPairs(deps).map(([name, version]) =>
        applyFilter(name, filter) ? [name, deps[name]] : null
      )
    )
  )

const parseDep = (filter, context) => async pkgQuery => {
  try {
    if (context.isMarked(pkgQuery)) {
      log.deps('found leaf %o', pkgQuery)
      return dependency(pkgQuery)
    }

    const { name, version = 'latest' } = pkgQuery

    log.parse('fetch %s@%s', name, version)
    const pkg = await fetchPkg(name, { version })

    context.markDep({
      name,
      version: pkg.version
    })

    return dependency(pkg, filter)
  } catch (e) {
    log.deps('parsing error %o', e)
    return null
  }
}

const pkgDependencies = (pkg, name, filter) =>
  !pkg[name]
    ? []
    : isUndefined(filter)
    ? pkg[name]
    : filterDeps(pkg[name], filter)

const leaf = ({ name, version } = {}) => ({
  name,
  version
})

const dependency = (pkg = {}, filter) => ({
  ...leaf(pkg),
  dependencies: pkgDependencies(pkg, 'dependencies', filter),
  peerDependencies: pkgDependencies(pkg, 'peerDependencies', filter)
})

const walkDeps = async (node, { type, options, depth }) => {
  const logWalk = log.walk(type, depth)
  logWalk('parse node %s', node.name)

  if (!node[type]) {
    return
  }

  node[type] = (
    await Promise.allSettled(
      Object.keys(node[type])
        .map(name => [name, node[type][name]])
        .map(([name, version]) => walk({ name, version }, options, depth + 1))
    )
  )
    .filter(({ status }) => status === 'fulfilled')
    .map(({ value }) => value)

  return node
}

const walk = async (pkg, options = {}, depth) => {
  const { parse, mergeDeps = false, maxDepth } = options

  log.deps('~~> %s@%s deps', pkg.name, pkg.version)
  const node = await parse(pkg)

  // run in sequence
  if (depth >= maxDepth) {
    return leaf(pkg)
  }

  await walkDeps(node, { type: 'dependencies', options, depth })
  await walkDeps(node, { type: 'peerDependencies', options, depth })

  if (mergeDeps === true) {
    node.dependencies = [...node.dependencies, ...node.peerDependencies]

    delete node.peerDependencies
  }

  return node
}

const parseContext = (list = []) => ({
  isMarked ({ name, version }) {
    list.includes(name)
  },
  markDep ({ name, version = '' }) {
    list.push(name)
  }
})

const flattenDependency = node => {
  const { dependencies = [], ...others } = node

  return [{ ...others }, dependencies.map(flattenDependency)]
}

// filter out root from dep list
const flattenTree = ({ dependencies } = {}) =>
  sortBy(flattenDeep(flattenDependency({ dependencies })), ['name'])

const outputFilename = pkg =>
  `${kebabCase(`${pkg.name.replace('/', '-')}-${pkg.version}`)}.json`

const buildDepsTree = async (
  pkg,
  { output, filter, mergeDeps = false, maxDepth = 10, flatten = false } = {}
) => {
  log.tree('build deps tree for %s@%s', pkg.name, pkg.version)
  const tree = await walk(
    pkg,
    {
      parse: parseDep(filter, parseContext()),
      mergeDeps: flatten || mergeDeps, // mergeDeps enforced with flatten
      maxDepth
    },
    0
  )

  if (output === false) {
    return tree
  }

  await fs.writeJson(outputFilename(pkg), flatten ? flattenTree(tree) : tree)

  return tree
}

module.exports = buildDepsTree

module.exports.filters = {
  scope
}
