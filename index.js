'format cjs'

const engine = require('./engine')
const conventionalCommitTypes = require('conventional-commit-types')
const { configLoader } = require('commitizen')

const types = {
  ...conventionalCommitTypes.types,
  config: {
    description: 'A code change that affects project configuration',
    title: 'Config',
  },
}

const config = configLoader.load() || {}
const options = {
  types: config.types || types,
  defaultType: process.env.CZ_TYPE || config.defaultType,
  defaultScope: process.env.CZ_SCOPE || config.defaultScope,
  defaultSubject: process.env.CZ_SUBJECT || config.defaultSubject,
  defaultBody: process.env.CZ_BODY || config.defaultBody,
  defaultIssues: process.env.CZ_ISSUES || config.defaultIssues,
  disableScopeLowerCase:
    process.env.DISABLE_SCOPE_LOWERCASE || config.disableScopeLowerCase,
  maxHeaderWidth:
    (process.env.CZ_MAX_HEADER_WIDTH &&
      parseInt(process.env.CZ_MAX_HEADER_WIDTH, 10)) ||
    config.maxHeaderWidth ||
    100,
  maxLineWidth:
    (process.env.CZ_MAX_LINE_WIDTH && parseInt(process.env.CZ_MAX_LINE_WIDTH, 10)) ||
    config.maxLineWidth ||
    100,
}

;(function (options) {
  try {
    // eslint-disable-next-line global-require
    const commitlintLoad = require('@commitlint/load')

    // eslint-disable-next-line complexity
    commitlintLoad().then(function (clConfig) {
      if (!clConfig.rules) {
        return
      }

      const maxHeaderLengthRule = clConfig.rules['header-max-length']
      if (
        typeof maxHeaderLengthRule === 'object' &&
        maxHeaderLengthRule.length >= 3 &&
        !process.env.CZ_MAX_HEADER_WIDTH &&
        !config.maxHeaderWidth
      ) {
        // eslint-disable-next-line prefer-destructuring, no-param-reassign
        options.maxHeaderWidth = maxHeaderLengthRule[2]
      }
    })
    // eslint-disable-next-line no-empty
  } catch (err) {}
})(options)

module.exports = engine(options)
