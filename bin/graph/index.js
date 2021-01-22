#!/usr/bin/env node
const chalk = require('chalk')
const command = require('./command')
const cli = require('meow')(
  `
    Usage
    -----
      $ deps-graph <name> [version]

    Options
    -------
    - scope @foo if you need to filter on a given scope.
    - flatten if deps tree must be flattened
    - maxDepth the maximum depth of the deps tree
    - mergeDeps if the deps and peer deps should be merged
    - output (json: default, png, or svg)
    - label (name: default, version) display name only or name with version
  `,
  {
    flags: {
      scope: {
        type: 'string',
        alias: 's'
      },
      flatten: {
        type: 'boolean',
        alias: 'f'
      },
      maxDepth: {
        type: 'number',
        alias: 'd'
      },
      output: {
        type: 'string',
        alias: 'o'
      },
      mergeDeps: {
        type: 'boolean',
        alias: 'm'
      },
      label: {
        type: 'string',
        alias: 'l'
      }
    }
  }
)

const exitWithError = message => {
  console.log(chalk.red(message))
  process.exit(1)
}

const parseCli = cli => {
  const { input, flags } = cli

  const name = input[0]

  if (!name) {
    return exitWithError('Missing package name')
  }

  command({ name, version: input[1], options: flags })
    .then(res => {
      console.log(res)
      process.exit(0)
    })
    .catch(e => {
      console.log(e)
      process.exit(1)
    })
}

parseCli(cli)
