/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import addInstanceOfAlias from '../addInstanceOfAlias';

describe('addInstanceOfAlias', () => {
  let Color;
  let Purple;
  let OtherPurple;
  let Black;
  beforeEach(() => {
    Color = class Color {};
    Purple = class Purple extends Color {};
    OtherPurple = class OtherPurple extends Color {};
    Black = class Black extends Color {};
  });

  it('adds the given alias to the target as an object to include in an instanceof call', () => {
    const purple = new Purple();
    expect(purple instanceof OtherPurple).toBe(false);
    addInstanceOfAlias(OtherPurple, Purple);
    expect(purple instanceof OtherPurple).toBe(true);
  });

  it('preserves the prior instanceof lookup', () => {
    const purple = new Purple();
    addInstanceOfAlias(OtherPurple, Purple);
    expect(purple instanceof Purple).toBe(true);
    expect(purple instanceof Color).toBe(true);
    expect(purple instanceof Black).toBe(false);
  });

  describe('when using the same value for the target and alias', () => {
    it('throws an error', () => {
      expect(() => {
        addInstanceOfAlias(Purple, Purple);
      }).toThrow(Error);
    });
  });
});
