/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.disableAutomock();

const getMatchers = require('../getMatchers');

describe('getMatchers', () => {
  it('contains toMatchSnapshot', () => {
    const matchers = getMatchers();
    expect(matchers.toMatchSnapshot).not.toBe(undefined);
  });

  describe('toMatchSnapshot', () => {
    it('does not accept paraters', () => {
      const toMatchSnapshot = getMatchers().toMatchSnapshot();
      const rendered = null;
      const expected = {};
      expect(
        () => toMatchSnapshot.compare(rendered, expected),
      ).toThrow();
    });

    it('only accepts strings', () => {
      const toMatchSnapshot = getMatchers().toMatchSnapshot();
      const rendered = {};
      const expected = undefined;
      expect(
        () => toMatchSnapshot.compare(rendered, expected),
      ).toThrow();
    });
  });
});
