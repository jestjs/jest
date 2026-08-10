/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import React from 'react';
import Mocked from '../__test_modules__/Mocked';
import Unmocked from '../__test_modules__/Unmocked';
import a from '../__test_modules__/a';
import b from '../__test_modules__/b';
import c from '../__test_modules__/c';
import d from '../__test_modules__/d';
import f from '../__test_modules__/f';
import jestBackticks from '../__test_modules__/jestBackticks';
// The virtual mock call below will be hoisted above this `require` call.
const virtualModule = require('virtual-module');

// These will all be hoisted above imports
jest.unmock('react');
jest.deepUnmock('../__test_modules__/Unmocked');
jest.unmock('../__test_modules__/c').unmock('../__test_modules__/d');

let e;
(function () {
  const _getJestObj = 42;
  e = require('../__test_modules__/e').default;
  // hoisted to the top of the function scope
  jest.unmock('../__test_modules__/e');
})();

jest.mock('../__test_modules__/f', () => {
  if (!globalThis.CALLS) {
    globalThis.CALLS = 0;
  }
  globalThis.CALLS++;

  return {
    _isMock: true,
    fn: () => {
      // The `jest.mock` transform will allow require, built-ins and globals.
      const path = require('path');
      const array = Array.from({length: 3});
      array[0] = path.sep;
      return jest.fn(() => array);
    },
  };
});
// uses backticks on purpose
// eslint-disable-next-line quotes
jest.mock(`../__test_modules__/jestBackticks`);
jest.mock('virtual-module', () => 'kiwi', {virtual: true});
// This has types that should be ignored by the out-of-scope variables check.
jest.mock('has-flow-types', () => (props: {children: unknown}) => 3, {
  virtual: true,
});

// These will not be hoisted
jest.unmock('../__test_modules__/a').dontMock('../__test_modules__/b');
// eslint-disable-next-line no-useless-concat
jest.unmock('../__test_modules__/' + 'a');
jest.dontMock('../__test_modules__/Mocked');
{
  const jest = {unmock: () => {}};
  // Would error (used before initialization) if hoisted to the top of the scope
  jest.unmock('../__test_modules__/a');
}

// This must not throw an error
const myObject = {mock: () => {}};
myObject.mock('apple', 27);

// Variable names prefixed with `mock` (ignore case) should not throw as out-of-scope
const MockMethods = () => {};
jest.mock('../__test_modules__/g', () => MockMethods);

describe('babel-plugin-jest-hoist', () => {
  it('does not throw during transform', () => {
    const object = {};
    object.__defineGetter__('foo', () => 'bar');
    expect(object.foo).toBe('bar');
  });

  it('hoists react unmock call before imports', () => {
    expect(typeof React).toBe('object');
    expect(React.isValidElement.mock).toBeUndefined();
  });

  it('hoists unmocked modules before imports', () => {
    expect(Unmocked._isMockFunction).toBeUndefined();
    expect(new Unmocked().isUnmocked).toBe(true);

    expect(c._isMockFunction).toBeUndefined();
    expect(c()).toBe('unmocked');

    expect(d._isMockFunction).toBeUndefined();
    expect(d()).toBe('unmocked');

    expect(e._isMock).toBeUndefined();
    expect(e()).toBe('unmocked');
  });

  it('hoists mock call with 2 arguments', () => {
    const path = require('path');

    expect(f._isMock).toBe(true);

    const mockFn = f.fn();
    expect(mockFn()).toEqual([path.sep, undefined, undefined]);
  });

  it('only executes the module factories once', () => {
    jest.resetModules();

    globalThis.CALLS = 0;

    require('../__test_modules__/f');
    expect(globalThis.CALLS).toBe(1);

    require('../__test_modules__/f');
    expect(globalThis.CALLS).toBe(1);

    delete globalThis.CALLS;
  });

  it('does not hoist dontMock calls before imports', () => {
    expect(Mocked._isMockFunction).toBe(true);
    expect(new Mocked().isMocked).toBeUndefined();

    expect(a._isMockFunction).toBe(true);
    expect(a()).toBeUndefined();

    expect(b._isMockFunction).toBe(true);
    expect(b()).toBeUndefined();
  });

  it('requires modules that also call jest.mock', () => {
    require('../mockFile');
    const mock = require('../banana');
    expect(mock).toBe('apple');
  });

  it('works with virtual modules', () => {
    expect(virtualModule).toBe('kiwi');
  });

  it('works if the file name is mocked via backticks and defined in the "__mocks__" directory', () => {
    expect(jestBackticks.name).toBe('backticks-with-jest');
  });
});
