/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const runJest = require('../runJest');
const {extractSummary} = require('../utils');

test('suite without mock name, mock called', () => {
  const {stderr, status} = runJest('mock-names/without-mock-name');

  expect(status).toBe(0);
  expect(stderr).toMatch(/PASS/);
});

test('suite without mock name, mock not called', () => {
  const {stderr, status} = runJest('mock-names/without-mock-name-not-called');

  expect(status).toBe(1);
  expect(stderr).toMatch(/expect\(jest\.fn\(\)\)\.toHaveBeenCalled/);
});

test('suite with mock name, mock called', () => {
  const {stderr, status} = runJest('mock-names/with-mock-name');

  expect(status).toBe(0);
  expect(stderr).toMatch(/PASS/);
});

test('suite with mock name, mock not called', () => {
  const {stderr, status} = runJest('mock-names/with-mock-name-not-called');

  expect(status).toBe(1);
  expect(stderr).toMatch(/expect\(myMockedFunction\)\.toHaveBeenCalled/);
});

test('suite with mock name, long form, mock called', () => {
  const {stderr, status} = runJest('mock-names/with-mock-name-long');

  expect(status).toBe(0);
  expect(stderr).toMatch(/PASS/);
});

test('suite with mock name, long form, mock not called', () => {
  const {stderr, status} = runJest('mock-names/with-mock-name-long-not-called');

  expect(status).toBe(1);
  expect(stderr).toMatch(/expect\(myMockedFunctionLong\)\.toHaveBeenCalled/);
});

test('suite with mock name, short form, mock called', () => {
  const {stderr, status} = runJest('mock-names/with-mock-name-short');

  expect(status).toBe(0);
  expect(stderr).toMatch(/PASS/);
});

test('suite with mock name, short form, mock not called', () => {
  const {stderr, status} = runJest(
    'mock-names/with-mock-name-short-not-called',
  );

  expect(status).toBe(1);
  expect(stderr).toMatch(/expect\(myMockedFunctionShort\)\.toHaveBeenCalled/);
});
