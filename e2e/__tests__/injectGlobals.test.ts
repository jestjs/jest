/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {skipSuiteOnJasmine} from '@jest/test-utils';
import {
  cleanup,
  createEmptyPackage,
  extractSummary,
  writeFiles,
} from '../Utils';
import {json as runJest} from '../runJest';

const DIR = path.resolve(tmpdir(), 'injectGlobalVariables.test');
const TEST_DIR = path.resolve(DIR, '__tests__');

skipSuiteOnJasmine();

beforeEach(() => {
  cleanup(DIR);
  createEmptyPackage(DIR);

  const content = `
    const {expect: importedExpect, test: importedTest} = require('@jest/globals');

    importedTest('no globals injected', () =>{
      importedExpect(typeof expect).toBe('undefined');
      importedExpect(typeof test).toBe('undefined');
      importedExpect(typeof jest).toBe('undefined');
      importedExpect(typeof beforeEach).toBe('undefined');
    });
  `;

  writeFiles(TEST_DIR, {'test.js': content});
});

afterAll(() => cleanup(DIR));

test.each`
  configSource | args
  ${'CLI'}     | ${['--inject-globals', 'false']}
  ${'config'}  | ${['--config', JSON.stringify({injectGlobals: false})]}
`('globals are undefined if passed `false` from $configSource', ({args}) => {
  const {json, stderr, exitCode} = runJest(DIR, args);

  const {summary, rest} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(exitCode).toBe(0);
  expect(json.numPassedTests).toBe(1);
});
