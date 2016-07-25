/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';
/* global jest */

global.__DEV__ = true;
global.__fbBatchedBridgeConfig = require('./bridge-mock');

require(
  'react-native/packager/react-packager/src/Resolver/polyfills/Object.es7',
);
require(
  'react-native/packager/react-packager/src/Resolver/polyfills/error-guard',
);

jest.mock('Text', () => 'Text');
jest.mock('View', () => 'Image');
jest.mock('View', () => 'View');

const emptyObject = {};
jest.mock('ReactNativePropRegistry', () => ({
  register: id => id,
  getByID: () => emptyObject,
}));
