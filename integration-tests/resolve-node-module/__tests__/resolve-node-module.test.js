/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

jest.mock('mock-module');
jest.mock('mock-jsx-module');

it('should resolve entry as index.js when package main is "."', () => {
  const mockModule = require('mock-module');
  expect(mockModule).toEqual('test');
});

it('should resolve entry as index with other configured module file extention when package main is "."', () => {
  const mockJsxModule = require('mock-jsx-module');
  expect(mockJsxModule).toEqual('test jsx');
});
