/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Runs in jsdom (Node)
describe('string utils (jsdom)', () => {
  it('trims whitespace', () => {
    expect('  hello  '.trim()).toBe('hello');
  });

  it('splits string', () => {
    expect('a,b,c'.split(',')).toEqual(['a', 'b', 'c']);
  });
});
