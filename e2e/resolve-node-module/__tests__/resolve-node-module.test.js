/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

jest.mock('mock-module');
jest.mock('mock-module-alt');
jest.mock('mock-jsx-module');
jest.mock('mock-module-without-pkg');

it('should resolve entry as index.js when package main is "."', () => {
  const mockModule = require('mock-module');
  expect(mockModule).toBe('test');
});

it('should resolve entry as index.js when package main is "./"', () => {
  const mockModule = require('mock-module-alt');
  expect(mockModule).toBe('test');
});

it('should resolve entry as index with other configured module file extension when package main is "."', () => {
  const mockJsxModule = require('mock-jsx-module');
  expect(mockJsxModule).toBe('test jsx');
});

it('should resolve entry as index without package.json', () => {
  const mockModuleWithoutPkg = require('mock-module-without-pkg');
  expect(mockModuleWithoutPkg).toBe('test mock-module-without-pkg');
});
