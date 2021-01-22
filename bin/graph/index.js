#!/usr/bin/env node
const chalk = require('chalk')
const command = require('./command')
const cli = require('meow')(
  `
    Usage
    -----
      $ deps-graph <name> or <name@version>

    Options
    -------
    - name (string)
        default to kebabCase(name-version)  the name of the generated file

    - version <semver>
                                            if you need a dep tree for a specific version

    - scope (string) 
        ex: @foo                            if you need to filter on a given scope.

    - flatten (boolean)
        default: false                      if deps tree must be flattened

    - maxDepth (number)
        default: 3                          the maximum depth of the deps tree

    - mergeDeps (boolean)
        default: false                      if the deps and peer deps should be merged

    - output (json, png, or svg)
        default: json                       the file type of the generated output

    - label (name, version)
        default: name                       display either name or name with version for nodes
  `,
  {
    flags: {
      name: {
        type: 'string',
        alias: 'n'
      },
      version: {
        type: 'string',
        alias: 'v'
      },
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
