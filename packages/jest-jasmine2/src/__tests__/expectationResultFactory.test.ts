/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import expectationResultFactory from '../expectationResultFactory';

describe('expectationResultFactory', () => {
  it('returns the result if passed.', () => {
    const options = {
      matcherName: 'testMatcher',
      passed: true,
    };
    const result = expectationResultFactory(options);
    expect(result).toMatchSnapshot();
  });

  it('returns the result if failed.', () => {
    const options = {
      actual: 'Fail',
      expected: 'Pass',
      matcherName: 'testMatcher',
      passed: false,
    };
    const result = expectationResultFactory(options);
    expect(result.message).toBe('thrown: undefined');
  });

  it('returns the result if failed (with `message`).', () => {
    const message = 'This message is not "Expected `Pass`, received `Fail`."';
    const options = {
      actual: 'Fail',
      error: new Error('This will be ignored in `message`.'),
      expected: 'Pass',
      matcherName: 'testMatcher',
      message,
      passed: false,
    };
    const result = expectationResultFactory(options);
    expect(result.message).toEqual(message);
  });

  it('returns the result if failed (with `error`).', () => {
    const options = {
      actual: 'Fail',
      error: new Error('Expected `Pass`, received `Fail`.'),
      expected: 'Pass',
      matcherName: 'testMatcher',
      passed: false,
    };
    const result = expectationResultFactory(options);
    expect(result.message).toBe('Error: Expected `Pass`, received `Fail`.');
  });

  it('returns the error name if the error message is empty', () => {
    const options = {
      actual: 'Fail',
      error: new Error(),
      expected: 'Pass',
      matcherName: 'testMatcher',
      passed: false,
    };
    const result = expectationResultFactory(options);
    expect(result.message).toBe('Error');
  });

  it('returns the result if failed (with `error` as a string).', () => {
    const options = {
      actual: 'Fail',
      error: 'Expected `Pass`, received `Fail`.',
      expected: 'Pass',
      matcherName: 'testMatcher',
      passed: false,
    };
    const result = expectationResultFactory(options);
    expect(result.message).toBe('Expected `Pass`, received `Fail`.');
  });

  it('returns the result if failed (with `error.stack` not as a string).', () => {
    const options = {
      actual: 'Fail',
      error: {stack: 42},
      expected: 'Pass',
      matcherName: 'testMatcher',
      passed: false,
    };
    const result = expectationResultFactory(options);
    expect(result.message).toMatchSnapshot();
  });
});
