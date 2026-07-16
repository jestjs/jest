/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

describe('test/it error throwing', () => {
  it('it throws error with missing callback function', () => {
    expect(() => {
      // @ts-expect-error: Testing runtime errors here
      it('test1');
    }).toThrow(
      'Missing second argument. It must be a callback function. Perhaps you want to use `test.todo` for a test placeholder.',
    );
  });
  it("it throws an error when first argument isn't valid", () => {
    expect(() => {
      // @ts-expect-error: Testing runtime errors here
      it(() => {});
    }).toThrow(
      'Invalid first argument, () => {}. It must be a named class, named function, number, or string.',
    );
  });
  it('it throws an error when callback function is not a function', () => {
    expect(() => {
      // @ts-expect-error: Testing runtime errors here
      it('test3', 'test3b');
    }).toThrow(
      'Invalid second argument, test3b. It must be a callback function.',
    );
  });
  test('test throws error with missing callback function', () => {
    expect(() => {
      // @ts-expect-error: Testing runtime errors here
      test('test4');
    }).toThrow(
      'Missing second argument. It must be a callback function. Perhaps you want to use `test.todo` for a test placeholder.',
    );
  });
  test("test throws an error when first argument isn't valid", () => {
    expect(() => {
      // @ts-expect-error: Testing runtime errors here
      test(() => {});
    }).toThrow(
      'Invalid first argument, () => {}. It must be a named class, named function, number, or string.',
    );
  });
  test('test throws an error when callback function is not a function', () => {
    expect(() => {
      // @ts-expect-error: Testing runtime errors here
      test('test6', 'test6b');
    }).toThrow(
      'Invalid second argument, test6b. It must be a callback function.',
    );
  });
});
