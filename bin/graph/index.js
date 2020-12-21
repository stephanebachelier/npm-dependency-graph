#!/usr/bin/env node
const chalk = require('chalk')
const command = require('./command')
const cli = require('meow')(
  `
    Usage
    -----
      $ graph <name> [version]
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
      registryUrl: {
        type: 'string',
        alias: 'r'
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
