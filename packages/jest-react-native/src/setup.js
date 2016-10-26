/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';
/* global jest */

const mockReactNative = require('./index');

jest
  .mock('ReactNativeDefaultInjection')
  .mock('setupDevtools')
  .mock('Image', () => mockReactNative.mockComponent('Image'))
  .mock('Text', () => mockReactNative.mockComponent('Text'))
  .mock('TextInput', () => mockReactNative.mockComponent('TextInput'))
  .mock('Modal', () => mockReactNative.mockComponent('Modal'))
  .mock('View', () => mockReactNative.mockComponent('View'))
  .mock('ScrollView', () => mockReactNative.mockComponent('ScrollView'))
  .mock(
    'ActivityIndicator',
    () => mockReactNative.mockComponent('ActivityIndicator'),
  )
  .mock('ListView', () => {
    const RealListView = require.requireActual('ListView');
    const ListView = mockReactNative.mockComponent('ListView');
    ListView.prototype.render = RealListView.prototype.render;
    return ListView;
  })
  .mock('ListViewDataSource', () => {
    const DataSource = require.requireActual('ListViewDataSource');
    DataSource.prototype.toJSON = function() {
      function ListViewDataSource(dataBlob) {
        this.items = 0;
        // Ensure this doesn't throw.
        try {
          Object.keys(dataBlob).forEach(key => {
            this.items += dataBlob[key] && dataBlob[key].length;
          });
        } catch (e) {
          this.items = 'unknown';
        }
      }

      return new ListViewDataSource(this._dataBlob);
    };
    return DataSource;
  })
  .mock('ensureComponentIsNative', () => () => true);

global.__DEV__ = true;
global.__fbBatchedBridgeConfig = require('./bridge-mock');

const {Response, Request, Headers, fetch} = require('whatwg-fetch');
global.Response = Response;
global.Request = Request;
global.Headers = Headers;
global.fetch = fetch;

require(
  'react-native/packager/react-packager/src/Resolver/polyfills/Object.es7',
);
require(
  'react-native/packager/react-packager/src/Resolver/polyfills/error-guard',
);

const mockNativeModules = require('NativeModules');
const mockEmptyObject = {};
const mockImageLoader = {
  configurable: true,
  enumerable: true,
  get: () => ({
    prefetchImage: jest.fn(),
    getSize: jest.fn(
      (uri, success) => process.nextTick(() => success(320, 240)),
    ),
  }),
};
Object.defineProperty(mockNativeModules, 'ImageLoader', mockImageLoader);
Object.defineProperty(mockNativeModules, 'ImageViewManager', mockImageLoader);

jest
  .doMock('NativeModules', () => mockNativeModules)
  .doMock('ReactNativePropRegistry', () => ({
    register: id => id,
    getByID: () => mockEmptyObject,
  }));
