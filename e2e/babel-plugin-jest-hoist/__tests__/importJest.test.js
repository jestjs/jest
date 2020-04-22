/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {jest} from '@jest/globals';
import * as JestGlobals from '@jest/globals';

import a from '../__test_modules__/a';
import b from '../__test_modules__/b';
import c from '../__test_modules__/c';

// These will be hoisted above imports

jest.unmock('../__test_modules__/a');
JestGlobals.jest.unmock('../__test_modules__/b');

// These will not be hoisted above imports

{
  const jest = {unmock: () => {}};
  jest.unmock('../__test_modules__/c');
}

// tests

test('named import', () => {
  expect(a._isMockFunction).toBe(undefined);
  expect(a()).toBe('unmocked');
});

test('namespace import', () => {
  expect(b._isMockFunction).toBe(undefined);
  expect(b()).toBe('unmocked');
});

test('fake jest, shadowed import', () => {
  expect(c._isMockFunction).toBe(true);
  expect(c()).toBe(undefined);
});
