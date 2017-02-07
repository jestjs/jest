/**
* Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*
* @emails oncall+jsinfra
*/

'use strict';

const highlight = require('../highlight');

const rootDir = '/Users/foo/dev/jest';
const rawPath = rootDir + '/jest-cli/__tests__/watch-test.js';
const relativePaths = [
  'jest-cli/__tests__/watch-test.js',
  '...t-cli/__tests__/watch-test.js',
  '.../__tests__/watch-test.js',
  '...sts__/watch-test.js',
  '...watch-test.js',
  '...-test.js',
  '....js',
  './watch-test.js',
];

it('highlight the trimmed part when there is only a rootDir match', () => {
  relativePaths
  .map(trimmed => highlight(rawPath, trimmed, 'Users/foo', rootDir))
  .forEach(output => expect(output).toMatchSnapshot());
});

it('highlights the trimmed part there is a non visible match', () => {
  relativePaths
  .filter(filePath => filePath.startsWith('...'))
  .map(trimmed => highlight(rawPath, trimmed, 'jest-cli', rootDir))
  .forEach(output => expect(output).toMatchSnapshot());
});

it('dims everything when there is no match', () => {
  relativePaths
  .map(trimmed => highlight(rawPath, trimmed, 'nomatch', rootDir))
  .forEach(output => expect(output).toMatchSnapshot());
});

it('highlights everything when there is a full match', () => {
  relativePaths
  .map(trimmed => highlight(rawPath, trimmed, 'User.*js', rootDir))
  .forEach(output => expect(output).toMatchSnapshot());
});

it('highlights part of file name when there is a partially match of the file name', () => {
  relativePaths
  .map(trimmed => highlight(rawPath, trimmed, 'watch', rootDir))
  .forEach(output => expect(output).toMatchSnapshot());
});
