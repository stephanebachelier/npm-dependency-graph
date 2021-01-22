const fetchPkg = require('package-json')
const toPairs = require('lodash/toPairs')
const compact = require('lodash/compact')
const flattenDeep = require('lodash/flattenDeep')
const sortBy = require('lodash/sortBy')
const LRUCache = require('mnemonist/lru-cache')

const cache = new LRUCache(1000)

const debug = require('debug')
const log = {
  tree: debug('tree'),
  parse: debug('parse'),
  deps: debug('deps'),
  walk: (type, depth) => debug(`walk:${type}:${depth}`)
}

const applyFilter = (name, filter) => filter(name)

const parseDep = filter => async ({ name, version = 'latest' }) => {
  try {
    log.parse('fetch %s@%s', name, version)
    const pkgName = `${name}@${version}`
    const value = cache.peek(pkgName)

    if (value) {
      log.tree('cache hit: %s', pkgName)
      return value
    }

    const pkg = await fetchPkg(name, { version })

    // avoid loop by marking first
    cache.set(pkgName, leaf(pkg))

    log.tree('caching %s ~> %o', pkgName, leaf(pkg))
    const deps = dependency(pkg, filter)

    cache.set(pkgName, deps)

    return deps
  } catch (e) {
    log.deps('parsing error %o', e)
    return null
  }
}

const pkgDependencies = (pkg, type, filter) =>
  compact(
    toPairs(pkg[type]).map(([name, version]) =>
      !applyFilter(name, filter)
        ? null
        : { name, version }
    )
  )

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
      node[type].map(({ name, version }) =>
        walk({ name, version }, options, depth + 1)
      )
    )
  )
    .filter(({ status }) => status === 'fulfilled')
    .map(({ value }) => value)

  return node
}

const walk = async (pkg, options = {}, depth) => {
  const { parse, mergeDeps = false, maxDepth } = options

  const node = await parse(pkg)

  // run in sequence
  if (depth >= maxDepth) {
    log.tree('depth %s for node %o')
    return leaf(node)
  }

  await walkDeps(node, { type: 'dependencies', options, depth })
  await walkDeps(node, { type: 'peerDependencies', options, depth })

  if (mergeDeps === true) {
    node.dependencies = [...node.dependencies, ...node.peerDependencies]

    delete node.peerDependencies
  }

  return node
}

const flattenDependency = node => {
  const { dependencies = [], ...others } = node

  return [{ ...others }, dependencies.map(flattenDependency)]
}

// filter out root from dep list
const flattenTree = ({ dependencies } = {}) =>
  sortBy(flattenDeep(flattenDependency({ dependencies })), ['name'])

module.exports = {
  parseDep,

  parseTree: async (
    pkg,
    { parse, mergeDeps = false, maxDepth = 10, flatten = false } = {}
  ) => {
    log.tree('build deps tree for %s@%s', pkg.name, pkg.version)
    const tree = await walk(
      pkg,
      {
        parse,
        mergeDeps: flatten || mergeDeps, // mergeDeps enforced with flatten
        maxDepth
      },
      0
    )

    return flatten ? flattenTree(tree) : tree
  }
}
