/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import prettyFormat = require('pretty-format');
import type {FailedAssertion} from '@jest/test-result';

function messageFormatter({error, message, passed}: Options) {
  if (passed) {
    return 'Passed.';
  }
  if (message) {
    return message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (
    // duck-type Error, see #2549
    error &&
    typeof error === 'object' &&
    typeof error.message === 'string' &&
    typeof error.name === 'string'
  ) {
    if (error.message === '') {
      return error.name;
    }
    return `${error.name}: ${error.message}`;
  }
  return `thrown: ${prettyFormat(error, {maxDepth: 3})}`;
}

function stackFormatter(
  options: Options,
  initError: Error | undefined,
  errorMessage: string,
) {
  if (options.passed) {
    return '';
  }

  if (options.error) {
    if (options.error.stack) {
      return options.error.stack;
    }

    if (options.error === errorMessage) {
      return errorMessage;
    }
  }

  if (initError) {
    return errorMessage.trimRight() + '\n\n' + initError.stack;
  }

  return new Error(errorMessage).stack;
}

export type Options = {
  matcherName: string;
  passed: boolean;
  actual?: any;
  error?: any;
  expected?: any;
  message?: string | null;
};

export default function expectationResultFactory(
  options: Options,
  initError?: Error,
): FailedAssertion {
  const message = messageFormatter(options);
  const stack = stackFormatter(options, initError, message);

  if (options.passed) {
    return {
      error: options.error,
      matcherName: options.matcherName,
      message,
      passed: options.passed,
      stack,
    };
  }

  return {
    actual: options.actual,
    error: options.error,
    expected: options.expected,
    matcherName: options.matcherName,
    message,
    passed: options.passed,
    stack,
  };
}
