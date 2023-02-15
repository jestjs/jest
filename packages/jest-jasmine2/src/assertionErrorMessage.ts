/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import {
  DiffOptions,
  diff,
  printExpected,
  printReceived,
} from 'jest-matcher-utils';
import type {AssertionErrorWithStack} from './types';

const assertOperatorsMap: Record<string, string> = {
  '!=': 'notEqual',
  '!==': 'notStrictEqual',
  '==': 'equal',
  '===': 'strictEqual',
};

const humanReadableOperators: Record<string, string> = {
  deepEqual: 'to deeply equal',
  deepStrictEqual: 'to deeply and strictly equal',
  equal: 'to be equal',
  notDeepEqual: 'not to deeply equal',
  notDeepStrictEqual: 'not to deeply and strictly equal',
  notEqual: 'to not be equal',
  notStrictEqual: 'not be strictly equal',
  strictEqual: 'to strictly be equal',
};

const getOperatorName = (operator: string | null, stack: string) => {
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

const operatorMessage = (operator: string | null) => {
  const niceOperatorName = getOperatorName(operator, '');
  const humanReadableOperator = humanReadableOperators[niceOperatorName];

  return typeof operator === 'string'
    ? `${humanReadableOperator || niceOperatorName} to:\n`
    : '';
};

const assertThrowingMatcherHint = (operatorName: string) =>
  operatorName
    ? chalk.dim('assert') +
      chalk.dim(`.${operatorName}(`) +
      chalk.red('function') +
      chalk.dim(')')
    : '';

const assertMatcherHint = (
  operator: string | null,
  operatorName: string,
  expected: unknown,
) => {
  let message = '';

  if (operator === '==' && expected === true) {
    message =
      chalk.dim('assert') +
      chalk.dim('(') +
      chalk.red('received') +
      chalk.dim(')');
  } else if (operatorName) {
    message =
      chalk.dim('assert') +
      chalk.dim(`.${operatorName}(`) +
      chalk.red('received') +
      chalk.dim(', ') +
      chalk.green('expected') +
      chalk.dim(')');
  }

  return message;
};

function assertionErrorMessage(
  error: AssertionErrorWithStack,
  options: DiffOptions,
): string {
  const {expected, actual, generatedMessage, message, operator, stack} = error;
  const diffString = diff(expected, actual, options);
  const hasCustomMessage = !generatedMessage;
  const operatorName = getOperatorName(operator, stack);
  const trimmedStack = stack
    .replace(message, '')
    .replace(/AssertionError(.*)/g, '');

  if (operatorName === 'doesNotThrow') {
    return `${
      buildHintString(assertThrowingMatcherHint(operatorName)) +
      chalk.reset('Expected the function not to throw an error.\n') +
      chalk.reset('Instead, it threw:\n')
    }  ${printReceived(actual)}${chalk.reset(
      hasCustomMessage ? `\n\nMessage:\n  ${message}` : '',
    )}${trimmedStack}`;
  }

  if (operatorName === 'throws') {
    if (error.generatedMessage) {
      return (
        buildHintString(assertThrowingMatcherHint(operatorName)) +
        chalk.reset(error.message) +
        chalk.reset(hasCustomMessage ? `\n\nMessage:\n  ${message}` : '') +
        trimmedStack
      );
    }
    return (
      buildHintString(assertThrowingMatcherHint(operatorName)) +
      chalk.reset('Expected the function to throw an error.\n') +
      chalk.reset("But it didn't throw anything.") +
      chalk.reset(hasCustomMessage ? `\n\nMessage:\n  ${message}` : '') +
      trimmedStack
    );
  }

  if (operatorName === 'fail') {
    return (
      buildHintString(assertMatcherHint(operator, operatorName, expected)) +
      chalk.reset(hasCustomMessage ? `Message:\n  ${message}` : '') +
      trimmedStack
    );
  }

  return `${
    buildHintString(assertMatcherHint(operator, operatorName, expected)) +
    chalk.reset(`Expected value ${operatorMessage(operator)}`)
  }  ${printExpected(expected)}\n${chalk.reset('Received:\n')}  ${printReceived(
    actual,
  )}${chalk.reset(hasCustomMessage ? `\n\nMessage:\n  ${message}` : '')}${
    diffString ? `\n\nDifference:\n\n${diffString}` : ''
  }${trimmedStack}`;
}

function buildHintString(hint: string) {
  return hint ? `${hint}\n\n` : '';
}

export default assertionErrorMessage;
