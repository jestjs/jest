/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

function assertionErrorMessage(error: Error, options) {
  const assertOperatorsMap = {
    '!=': 'notEqual',
    '!==': 'notStrictEqual',
    '==': 'equal',
    '===': 'strictEqual',
  };

  const {expected, actual, message, operator} = error || {};
  const {
    printReceived,
    printExpected,
  } = require('jest-matcher-utils');

  if (expected !== undefined && actual !== undefined) {
    const chalk = require('chalk');
    const diff = require('jest-diff');
    const diffString = diff(expected, actual, options);
    const negator = operator.startsWith('!') || operator.startsWith('not');
    const hasCustomMessage = !error.generatedMessage;

    const assertMatcherHint = () => {
      let message = chalk.dim('assert') +
        chalk.dim('.' + (assertOperatorsMap[operator] || operator)) +
        chalk.dim('(') +
        chalk.red('received') +
        chalk.dim(', ') +
        chalk.green('expected') +
        chalk.dim(')');

      if (operator === '==') {
        message += ' or ' +
          chalk.dim('assert') +
          chalk.dim('(') +
          chalk.red('received') +
          chalk.dim(') ');
      }

      return message;
    };

    const operatorMessage = () =>
      operator.startsWith('!') || operator.startsWith('=')
        ? `${negator ? 'not ' : ''}to be (operator: ${operator}):\n`
        : `to ${operator} to:\n`;

    return assertMatcherHint() +
      '\n\n' +
      chalk.reset(`Expected value ${operatorMessage()}`) +
      `  ${printExpected(expected)}\n` +
      chalk.reset(`Received:\n`) +
      `  ${printReceived(actual)}` +
      chalk.reset(hasCustomMessage ? '\n\nMessage:\n  ' + message : '') +
      (diffString ? `\n\nDifference:\n\n${diffString}` : '') +
      error.stack.replace(/AssertionError(.*)/g, '');
  }
  return error;
}

module.exports = assertionErrorMessage;
