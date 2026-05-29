/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('fs');
const url = require('url');

test('arrays returned by Node APIs use the test realm Array constructor', () => {
  const {query} = url.parse('https://jestjs.io/?tag=node&tag=vm', true);

  expect(query.tag).toBeInstanceOf(Array);
});

test('errors thrown by Node APIs use the test realm Error constructor', () => {
  expect.hasAssertions();

  try {
    fs.readFileSync('this-file-does-not-exist');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
  }
});

test('errors thrown by Node APIs do not match unrelated subclasses', () => {
  class CustomError extends Error {}

  expect.hasAssertions();

  try {
    fs.readFileSync('this-file-does-not-exist');
  } catch (error) {
    expect(error).not.toBeInstanceOf(CustomError);
  }
});

test('Object.getPrototypeOf maps Node API results to the test realm', () => {
  const report = process.report.getReport();

  expect(report).toBeInstanceOf(Object);
  expect(Object.getPrototypeOf(report)).toBe(Object.prototype);
});
