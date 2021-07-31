/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 import * as path from 'path';
 import {wrap} from 'jest-snapshot-serializer-raw';
 import {cleanup, extractSummary, writeFiles} from '../Utils';
 import runJest from '../runJest';
 
 const DIR = path.resolve(__dirname, '../coverage-threshold');
 
 beforeEach(() => cleanup(DIR));
 afterAll(() => cleanup(DIR));
test('exits with 1 if path threshold group is not found in coverage data', () => {
  const pkgJson = {
    jest: {
      collectCoverage: true,
      collectCoverageFrom: ['**/*.js'],
      coverageThreshold: {
        'apple.js': {
          lines: 100,
        },
      },
    },
  };

  writeFiles(DIR, {
    '__tests__/banana.test.js': `
      const banana = require('../banana.js');
      test('banana', () => expect(banana()).toBe(3));
    `,
    'banana.js': `
      module.exports = () => {
        return 1 + 2;
      };
    `,
    'package.json': JSON.stringify(pkgJson, null, 2),
  });

  const {stdout, stderr, exitCode} = runJest(
    DIR,
    ['--coverage', '--ci=false'],
    {stripAnsi: true},
  );
  const {rest, summary} = extractSummary(stderr);

  expect(exitCode).toBe(1);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(wrap(stdout)).toMatchSnapshot('stdout');
});