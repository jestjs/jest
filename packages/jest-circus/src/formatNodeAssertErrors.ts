/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AssertionError} from 'assert';
import * as pc from 'picocolors';
import type {Circus} from '@jest/types';
import {
  type DiffOptions,
  diff,
  printExpected,
  printReceived,
} from 'jest-matcher-utils';
import {format as prettyFormat} from 'pretty-format';

interface AssertionErrorWithStack extends AssertionError {
  stack: string;
}

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

const formatNodeAssertErrors = (
  event: Circus.Event,
  state: Circus.State,
): void => {
  if (event.name === 'test_done') {
    event.test.errors = event.test.errors.map(errors => {
      let error;
      if (Array.isArray(errors)) {
        const [originalError, asyncError] = errors;

        if (originalError == null) {
          error = asyncError;
        } else if (originalError.stack) {
          error = originalError;
        } else {
          error = asyncError;

          error.message =
            originalError.message ||
            `thrown: ${prettyFormat(originalError, {maxDepth: 3})}`;
        }
      } else {
        error = errors;
      }
      return isAssertionError(error)
        ? {message: assertionErrorMessage(error, {expand: state.expand})}
        : errors;
    });
  }
};

const getOperatorName = (operator: string | undefined, stack: string) => {
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

const operatorMessage = (operator: string | undefined) => {
  const niceOperatorName = getOperatorName(operator, '');
  const humanReadableOperator = humanReadableOperators[niceOperatorName];

  return typeof operator === 'string'
    ? `${humanReadableOperator || niceOperatorName} to:\n`
    : '';
};

const assertThrowingMatcherHint = (operatorName: string) =>
  operatorName
    ? pc.dim('assert') +
      pc.dim(`.${operatorName}(`) +
      pc.red('function') +
      pc.dim(')')
    : '';

const assertMatcherHint = (
  operator: string | undefined | null,
  operatorName: string,
  expected: unknown,
) => {
  let message = '';

  if (operator === '==' && expected === true) {
    message = pc.dim('assert') + pc.dim('(') + pc.red('received') + pc.dim(')');
  } else if (operatorName) {
    message =
      pc.dim('assert') +
      pc.dim(`.${operatorName}(`) +
      pc.red('received') +
      pc.dim(', ') +
      pc.green('expected') +
      pc.dim(')');
  }

  return message;
};

function assertionErrorMessage(
  error: AssertionErrorWithStack,
  options: DiffOptions,
) {
  const {expected, actual, generatedMessage, message, operator, stack} = error;
  const diffString = diff(expected, actual, options);
  const hasCustomMessage = !generatedMessage;
  const operatorName = getOperatorName(operator, stack);
  const trimmedStack = stack
    .replace(message, '')
    .replaceAll(/AssertionError(.*)/g, '');

  if (operatorName === 'doesNotThrow') {
    return (
      // eslint-disable-next-line prefer-template
      buildHintString(assertThrowingMatcherHint(operatorName)) +
      pc.reset('Expected the function not to throw an error.\n') +
      pc.reset('Instead, it threw:\n') +
      `  ${printReceived(actual)}` +
      pc.reset(hasCustomMessage ? `\n\nMessage:\n  ${message}` : '') +
      trimmedStack
    );
  }

  if (operatorName === 'throws') {
    if (error.generatedMessage) {
      return (
        buildHintString(assertThrowingMatcherHint(operatorName)) +
        pc.reset(error.message) +
        pc.reset(hasCustomMessage ? `\n\nMessage:\n  ${message}` : '') +
        trimmedStack
      );
    }
    return (
      buildHintString(assertThrowingMatcherHint(operatorName)) +
      pc.reset('Expected the function to throw an error.\n') +
      pc.reset("But it didn't throw anything.") +
      pc.reset(hasCustomMessage ? `\n\nMessage:\n  ${message}` : '') +
      trimmedStack
    );
  }

  if (operatorName === 'fail') {
    return (
      buildHintString(assertMatcherHint(operator, operatorName, expected)) +
      pc.reset(hasCustomMessage ? `Message:\n  ${message}` : '') +
      trimmedStack
    );
  }

  return (
    // eslint-disable-next-line prefer-template
    buildHintString(assertMatcherHint(operator, operatorName, expected)) +
    pc.reset(`Expected value ${operatorMessage(operator)}`) +
    `  ${printExpected(expected)}\n` +
    pc.reset('Received:\n') +
    `  ${printReceived(actual)}` +
    pc.reset(hasCustomMessage ? `\n\nMessage:\n  ${message}` : '') +
    (diffString ? `\n\nDifference:\n\n${diffString}` : '') +
    trimmedStack
  );
}

function isAssertionError(
  error: Circus.TestError,
): error is AssertionErrorWithStack {
  return (
    error &&
    (error instanceof AssertionError ||
      error.name === AssertionError.name ||
      error.code === 'ERR_ASSERTION')
  );
}

function buildHintString(hint: string) {
  return hint ? `${hint}\n\n` : '';
}

export default formatNodeAssertErrors;
