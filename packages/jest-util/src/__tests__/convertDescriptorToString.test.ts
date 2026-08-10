/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import convertDescriptorToString from '../convertDescriptorToString';

describe(convertDescriptorToString, () => {
  test.each([
    [undefined, 'undefined'],
    ['name', 'name'],
    [123, '123'],
    [function named() {}, 'named'],
    [class Named {}, 'Named'],
  ])('%p', (input, output) => {
    expect(convertDescriptorToString(input)).toBe(output);
  });

  test.each([
    ['null', null],
    ['array', ['abc']],
    ['object', {abc: 'def'}],
    ['anonymous function expression', function () {}],
    ['anonymous arrow function', () => {}],
    ['anonymous class expression', class {}],
  ])('%s', (_, input) => {
    expect(() => {
      // @ts-expect-error: Testing runtime error
      return convertDescriptorToString(input);
    }).toThrow(
      `Invalid first argument, ${String(
        input,
      )}. It must be a named class, named function, number, or string.`,
    );
  });
});
