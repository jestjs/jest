/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {JestAssertionError, expect as jestExpect} from '../';

test.each([
  [
    'ArrayBuffer toStrictEqual',
    () =>
      jestExpect(new Uint8Array([1]).buffer).toStrictEqual(
        new Uint8Array([2]).buffer,
      ),
    'toStrictEqual',
  ],
  [
    'ArrayBuffer toBe',
    () => jestExpect(new ArrayBuffer(1)).toBe(new ArrayBuffer(1)),
    'toBe',
  ],
  [
    'DataView',
    () => jestExpect(new DataView(new ArrayBuffer(1))).toEqual({x: 1}),
    'toEqual',
  ],
  [
    'generator',
    () => jestExpect((function* () {})()).toEqual({x: 1}),
    'toEqual',
  ],
  [
    'Map with a boxed Number',
    () =>
      jestExpect(
        new Map<string, unknown>([
          // eslint-disable-next-line no-new-wrappers, unicorn/new-for-builtins
          ['n', new Number(0)],
          ['k', 1],
        ]),
      ).toEqual(
        new Map<string, unknown>([
          // eslint-disable-next-line no-new-wrappers, unicorn/new-for-builtins
          ['n', new Number(0)],
          ['k', 2],
        ]),
      ),
    'toEqual',
  ],
])('%s reports an assertion failure', (_name, assertion, matcher) => {
  let error;
  try {
    assertion();
  } catch (error_) {
    error = error_;
  }

  expect(error).toBeInstanceOf(JestAssertionError);
  expect(error).toMatchObject({
    matcherResult: {
      message: expect.stringContaining(matcher),
      name: matcher,
      pass: false,
    },
  });
});
