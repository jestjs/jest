/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const countPath = path.join(__dirname, '.tries');

beforeAll(() => {
  fs.writeFileSync(countPath, '0', 'utf8');
});

jest.retryTimes(3);

it('retries', () => {
  const tries = Number.parseInt(fs.readFileSync(countPath, 'utf8'), 10);
  fs.writeFileSync(countPath, `${tries + 1}`, 'utf8');
  expect(tries).toBe(3);
});

afterAll(() => {
  // cleanup
  fs.unlinkSync(countPath);
});
