/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import prettyFormat from 'pretty-format';
import {isError} from 'jest-util';

function messageFormatter({error, message, passed}) {
  if (passed) {
    return 'Passed.';
  }
  if (message) {
    return message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (isError(error)) {
    // $FlowFixMe: as `isError` returned `true`, this is safe
    return `${error.name}: ${error.message}`;
  }
  return `thrown: ${prettyFormat(error, {maxDepth: 3})}`;
}

function stackFormatter(options, errorMessage) {
  if (options.passed) {
    return '';
  }
  const stack =
    (options.error && options.error.stack) || new Error(errorMessage).stack;
  return stack;
}

type Options = {
  matcherName: string,
  passed: boolean,
  actual?: any,
  error?: any,
  expected?: any,
  message?: string,
};

export default function expectationResultFactory(options: Options) {
  const message = messageFormatter(options);
  const stack = stackFormatter(options, message);

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
