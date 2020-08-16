'format cjs'

const wrap = require('word-wrap')
const map = require('lodash.map')
const longest = require('longest')
const chalk = require('chalk')

const filter = function (array) {
  return array.filter(function (x) {
    return x
  })
}

const headerLength = function (answers) {
  return answers.type.length + 2 + (answers.scope ? answers.scope.length + 2 : 0)
}

const maxSummaryLength = function (options, answers) {
  return options.maxHeaderWidth - headerLength(answers)
}

const formatSubject = function (subject) {
  let formatted = subject.trim()

  const firstCharacter = formatted.charAt(0)
  const startsWithUppercase = firstCharacter.toLowerCase() !== firstCharacter

  if (startsWithUppercase) {
    formatted = formatted.charAt(0).toLowerCase() + formatted.slice(1, subject.length)
  }

  while (formatted.endsWith('.')) {
    formatted = formatted.slice(0, formatted.length - 1)
  }

  return formatted
}

// This can be any kind of SystemJS compatible module.
// We use Commonjs here, but ES6 or AMD would do just
// fine.
module.exports = function (options) {
  const { types } = options

  const length = longest(Object.keys(types)).length + 1
  const choices = map(types, function (type, key) {
    return {
      name: `${`${key}:`.padEnd(length)} ${type.description}`,
      value: key,
    }
  })

  return {
    // When a user runs `git cz`, prompter will
    // be executed. We pass you cz, which currently
    // is just an instance of inquirer.js. Using
    // this you can ask questions and get answers.
    //
    // The commit callback should be executed when
    // you're ready to send back a commit template
    // to git.
    //
    // By default, we'll de-indent your commit
    // template and will keep empty lines.
    prompter(cz, commit) {
      // Let's ask some questions of the user
      // so that we can populate our commit
      // template.
      //
      // See inquirer.js docs for specifics.
      // You can also opt to use another input
      // collection library if you prefer.
      cz.prompt([
        {
          type: 'list',
          name: 'type',
          message: 'Commit type?',
          choices,
          default: options.defaultType,
        },
        {
          type: 'input',
          name: 'scope',
          message: 'Commit scope? (optional)',
          default: options.defaultScope,
          filter(value) {
            return options.disableScopeLowerCase
              ? value.trim()
              : value.trim().toLowerCase()
          },
        },
        {
          type: 'input',
          name: 'subject',
          message(answers) {
            return `Commit summary (max ${maxSummaryLength(options, answers)} chars):\n`
          },
          default: options.defaultSubject,
          validate(subject, answers) {
            const formattedSubject = formatSubject(subject)
            const subjectLength = formattedSubject.length
            const maxLength = maxSummaryLength(options, answers)

            if (subjectLength === 0) {
              return 'Commit summary is required'
            }

            if (subjectLength <= maxLength) {
              return true
            }

            return `Subject length must be less than or equal to ${maxLength} characters. Current length is ${subjectLength} characters.`
          },
          transformer(subject, answers) {
            const filteredSubject = formatSubject(subject)
            const color =
              filteredSubject.length <= maxSummaryLength(options, answers)
                ? chalk.green
                : chalk.red
            return color(`(${filteredSubject.length}) ${subject}`)
          },
          filter(subject) {
            return formatSubject(subject)
          },
        },
        {
          type: 'input',
          name: 'body',
          message: 'Commit body (optional):\n',
          default: options.defaultBody,
        },
        {
          type: 'confirm',
          name: 'isBreaking',
          message: 'Are there any breaking changes?',
          default: false,
        },
        {
          type: 'input',
          name: 'breakingBody',
          default: '-',
          message: 'Describe the BREAKING CHANGE:\n',
          when(answers) {
            return answers.isBreaking && !answers.body
          },
          validate(breakingBody) {
            return (
              breakingBody.trim().length > 0 || 'Body is required for BREAKING CHANGE'
            )
          },
        },
        {
          type: 'input',
          name: 'breaking',
          message: 'Describe the BREAKING CHANGE:\n',
          when(answers) {
            return answers.isBreaking
          },
        },
        // eslint-disable-next-line complexity
      ]).then(function (answers) {
        const wrapOptions = {
          trim: true,
          cut: false,
          newline: '\n',
          indent: '',
          width: options.maxLineWidth,
        }

        // parentheses are only needed when a scope is present
        const scope = answers.scope ? `(${answers.scope})` : ''

        // Hard limit this line in the validate
        const head = `${answers.type + scope}: ${answers.subject}`

        // Wrap these lines at options.maxLineWidth characters
        const body = answers.body ? wrap(answers.body, wrapOptions) : false

        // Apply breaking change prefix, removing it if already present
        let breaking = answers.breaking ? answers.breaking.trim() : ''
        breaking = breaking
          ? `BREAKING CHANGE: ${breaking.replace(/^BREAKING CHANGE: /, '')}`
          : ''
        breaking = breaking ? wrap(breaking, wrapOptions) : false

        const issues = false

        commit(filter([head, body, breaking, issues]).join('\n\n'))
      })
    },
  }
}
