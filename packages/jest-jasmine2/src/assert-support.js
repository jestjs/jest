/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {DiffOptions} from 'jest-diff/src/diffStrings';

const {printReceived, printExpected} = require('jest-matcher-utils');
const chalk = require('chalk');
const diff = require('jest-diff');

type AssertionError = {|
  actual: ?string,
  expected: ?string,
  generatedMessage: boolean,
  message: string,
  name: string,
  operator: ?string,
  stack: string,
|};

const assertOperatorsMap = {
  '!=': 'notEqual',
  '!==': 'notStrictEqual',
  '==': 'equal',
  '===': 'strictEqual',
};

const humanReadableOperators = {
  deepEqual: 'to deeply equal',
  deepStrictEqual: 'to deeply and strictly equal',
  notDeepEqual: 'not to deeply equal',
  notDeepStrictEqual: 'not to deeply and strictly equal',
};

const getOperatorName = (operator: ?string, stack: string) => {
  if (typeof operator === 'string') {
    return assertOperatorsMap[operator] || operator;
  }
  if (stack.match('.doesNotThrow')) {
    return 'doesNotThrow';
  }
  if (stack.match('.throws')) {
    return 'throws';
  }
  return '';
};

const operatorMessage = (operator: ?string, negator: boolean) =>
  typeof operator === 'string'
    ? operator.startsWith('!') || operator.startsWith('=')
        ? `${negator ? 'not ' : ''}to be (operator: ${operator}):\n`
        : `${humanReadableOperators[operator] || operator} to:\n`
    : '';

const assertThrowingMatcherHint = (operatorName: string) => {
  return (
    chalk.dim('assert') +
    chalk.dim('.' + operatorName + '(') +
    chalk.red('function') +
    chalk.dim(')')
  );
};

const assertMatcherHint = (operator: ?string, operatorName: string) => {
  let message =
    chalk.dim('assert') +
    chalk.dim('.' + operatorName + '(') +
    chalk.red('received') +
    chalk.dim(', ') +
    chalk.green('expected') +
    chalk.dim(')');

  if (operator === '==') {
    message +=
      ' or ' +
      chalk.dim('assert') +
      chalk.dim('(') +
      chalk.red('received') +
      chalk.dim(') ');
  }

  return message;
};

function assertionErrorMessage(error: AssertionError, options: DiffOptions) {
  const {expected, actual, message, operator, stack} = error;
  const diffString = diff(expected, actual, options);
  const negator =
    typeof operator === 'string' &&
    (operator.startsWith('!') || operator.startsWith('not'));
  const hasCustomMessage = !error.generatedMessage;
  const operatorName = getOperatorName(operator, stack);

  if (operatorName === 'doesNotThrow') {
    return (
      assertThrowingMatcherHint(operatorName) +
      '\n\n' +
      chalk.reset(`Expected the function not to throw an error.\n`) +
      chalk.reset(`Instead, it threw:\n`) +
      `  ${printReceived(actual)}` +
      chalk.reset(hasCustomMessage ? '\n\nMessage:\n  ' + message : '') +
      stack.replace(/AssertionError(.*)/g, '')
    );
  }

  if (operatorName === 'throws') {
    return (
      assertThrowingMatcherHint(operatorName) +
      '\n\n' +
      chalk.reset(`Expected the function to throw an error.\n`) +
      chalk.reset(`But it didn't throw anything.`) +
      chalk.reset(hasCustomMessage ? '\n\nMessage:\n  ' + message : '') +
      stack.replace(/AssertionError(.*)/g, '')
    );
  }

  return (
    assertMatcherHint(operator, operatorName) +
    '\n\n' +
    chalk.reset(`Expected value ${operatorMessage(operator, negator)}`) +
    `  ${printExpected(expected)}\n` +
    chalk.reset(`Received:\n`) +
    `  ${printReceived(actual)}` +
    chalk.reset(hasCustomMessage ? '\n\nMessage:\n  ' + message : '') +
    (diffString ? `\n\nDifference:\n\n${diffString}` : '') +
    stack.replace(/AssertionError(.*)/g, '')
  );
}

module.exports = assertionErrorMessage;
