/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

/* eslint-disable no-useless-concat */

'use strict';

import React from 'react';
import Unmocked from '../__test_modules__/Unmocked';
import Mocked from '../__test_modules__/Mocked';
import a from '../__test_modules__/a';
import b from '../__test_modules__/b';
import c from '../__test_modules__/c';
import d from '../__test_modules__/d';
import e from '../__test_modules__/e';

// These will all be hoisted above imports
jest.unmock('react');
jest.unmock('../__test_modules__/Unmocked');
jest
  .unmock('../__test_modules__/c')
  .unmock('../__test_modules__/d');
jest.mock('../__test_modules__/e', () => {
  if (!global.CALLS) {
    global.CALLS = 0;
  }
  global.CALLS++;

  return {
    _isMock: true,
    fn: () => {
      // The `jest.mock` transform will allow require, built-ins and globals.
      const path = require('path');
      const array = new Array(3);
      array[0] = path.sep;
      return jest.fn(() => array);
    },
  };
});

// These will not be hoisted
jest.unmock('../__test_modules__/a').dontMock('../__test_modules__/b');
jest.unmock('../__test_modules__/' + 'c');
jest.dontMock('../__test_modules__/Mocked');

describe('babel-plugin-jest-hoist', () => {

  it('does not throw during transform', () => {
    const object = {};
    object.__defineGetter__('foo', () => 'bar');
    expect(object.foo).toEqual('bar');
  });

  it('hoists react unmock call before imports', () => {
    expect(typeof React).toEqual('object');
    expect(React.isValidElement.mock).toBe(undefined);
  });

  it('hoists unmocked modules before imports', () => {
    expect(Unmocked._isMockFunction).toBe(undefined);
    expect((new Unmocked()).isUnmocked).toEqual(true);

    expect(c._isMockFunction).toBe(undefined);
    expect(c()).toEqual('unmocked');

    expect(d._isMockFunction).toBe(undefined);
    expect(d()).toEqual('unmocked');
  });

  it('hoists mock call with 2 arguments', () => {
    const path = require('path');

    expect(e._isMock).toBe(true);

    const mockFn = e.fn();
    expect(mockFn()).toEqual([path.sep, undefined, undefined]);
  });

  it('only executes the module factories once', () => {
    global.CALLS = 0;

    require('../__test_modules__/e');
    expect(global.CALLS).toEqual(1);

    require('../__test_modules__/e');
    expect(global.CALLS).toEqual(1);

    delete global.CALLS;
  });

  it('does not hoist dontMock calls before imports', () => {
    expect(Mocked._isMockFunction).toBe(true);
    expect((new Mocked()).isMocked).toEqual(undefined);

    expect(a._isMockFunction).toBe(true);
    expect(a()).toEqual(undefined);

    expect(b._isMockFunction).toBe(true);
    expect(b()).toEqual(undefined);
  });
});
