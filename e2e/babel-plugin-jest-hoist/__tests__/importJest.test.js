/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {jest} from '@jest/globals';
import * as JestGlobals from '@jest/globals';

// The virtual mock call below will be hoisted above this `require` call.
const virtualModule = require('virtual-module');
const virtualModule2 = require('virtual-module-2');

jest.mock('virtual-module', () => 'kiwi', {virtual: true});
JestGlobals.jest.mock('virtual-module-2', () => 'banana', {virtual: true});

// The mock call below will not be hoisted
const a = require('../__test_modules__/a');

{
  const jest = {mock: () => {}};
  jest.mock('../__test_modules__/a', () => 'too late');
}

test('named import', () => {
  expect(virtualModule).toBe('kiwi');
});

test('namespace import', () => {
  expect(virtualModule2).toBe('banana');
});

test('fake jest, shadowed import', () => {
  expect(a()).toBe('unmocked');
});
