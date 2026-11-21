/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect as jestExpect} from '../';

afterEach(() => {
  jestExpect.setState({diff: undefined, expand: undefined});
});

const getErrorMessage = (fn: () => unknown): string => {
  try {
    fn();
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error('Expected the matcher to throw');
};

test('passes custom annotations from state.diff to the printed diff', () => {
  jestExpect.setState({
    diff: {aAnnotation: 'ExpectedFoo', bAnnotation: 'ReceivedBar'},
  });

  const message = getErrorMessage(() =>
    jestExpect({a: 1, b: 2}).toEqual({a: 1, b: 3}),
  );

  expect(message).toContain('- ExpectedFoo');
  expect(message).toContain('+ ReceivedBar');
  expect(message).not.toContain('- Expected\n');
});

test('passes custom indicators from state.diff to the printed diff', () => {
  jestExpect.setState({diff: {aIndicator: '<<', bIndicator: '>>'}});

  const message = getErrorMessage(() => jestExpect({a: 1}).toEqual({a: 2}));

  expect(message).toContain('<< Expected');
  expect(message).toContain('>> Received');
});

test('passes contextLines from state.diff to the printed diff', () => {
  const received = {a: 1, b: 2, c: 3, d: 4, e: 5};
  const expected = {a: 1, b: 2, c: 3, d: 4, e: 6};

  // expand: false so that contextLines has an effect
  jestExpect.setState({expand: false});
  const defaultMessage = getErrorMessage(() =>
    jestExpect(received).toEqual(expected),
  );
  expect(defaultMessage).toContain('"a": 1');

  jestExpect.setState({diff: {contextLines: 0}, expand: false});
  const message = getErrorMessage(() => jestExpect(received).toEqual(expected));
  expect(message).not.toContain('"a": 1');
  expect(message).toContain('"e"');
});

test('passes omitAnnotationLines from state.diff to the printed diff', () => {
  jestExpect.setState({diff: {omitAnnotationLines: true}});

  const message = getErrorMessage(() => jestExpect({a: 1}).toEqual({a: 2}));

  expect(message).not.toContain('- Expected');
  expect(message).not.toContain('+ Received');
});

test('does not use diff options when state.diff is not set', () => {
  const message = getErrorMessage(() =>
    jestExpect({a: 1, b: 2}).toEqual({a: 1, b: 3}),
  );

  expect(message).toContain('- Expected');
  expect(message).toContain('+ Received');
});
