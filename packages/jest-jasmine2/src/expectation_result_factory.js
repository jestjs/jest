/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

function messageFormatter({error, message, passed}) {
  if (passed) {
    return 'Passed.';
  }
  if (message) {
    return message;
  }
  if (!error) {
    return '';
  }
  return error.message && error.name
    ? `${error.name}: ${error.message}`
    : `${error.toString()} thrown`;
}

function stackFormatter(options, errorMessage) {
  if (options.passed) {
    return '';
  }
  const {stack} = options.error || new Error(errorMessage);
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
