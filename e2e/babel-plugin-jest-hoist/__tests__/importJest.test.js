/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {jest} from '@jest/globals';

// The virtual mock call below will be hoisted above this `require` call.
const virtualModule = require('virtual-module');

jest.mock('virtual-module', () => 'kiwi', {virtual: true});

test('works with virtual modules', () => {
  expect(virtualModule).toBe('kiwi');
});
