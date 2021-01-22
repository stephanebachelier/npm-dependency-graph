const kebabCase = require('lodash/kebabCase')
const fs = require('fs-extra')
const sharp = require('sharp')

const { buildChart } = require('./graph')

const baseName = pkg =>
  kebabCase(`${pkg.name.replace('/', '-')}-${pkg.version}`)

const fileName = (pkg, name, ext) => `${name || baseName(pkg)}.${ext}`

const buildOutput = async (pkg, tree, { output, label, name = null } = {}) => {
  switch (output) {
    case 'svg': {
      const chart = await buildChart(tree, { label })

      return fs.writeFile(fileName(pkg, 'svg'), chart, { encoding: 'utf8' })
    }

    case 'png': {
      const chart = await buildChart(tree, { label })

      return sharp(Buffer.from(chart))
        .flatten({
          background: '#fff'
        })
        .png()
        .toFile(fileName(pkg, name, 'png'))
    }

    case 'json': {
      return fs.writeJson(fileName(pkg, name, 'json'), tree)
    }

    default: {
      console.log('Invalid output => using json')
      return fs.writeJson(fileName(pkg, name, 'json'), tree)
    }
  }
}

module.exports = {
  fileName,

  buildOutput
}
