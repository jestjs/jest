/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {json as runJestJson} from '../runJest';

const DIR = resolve(__dirname, '../test-environment-esm');

it('support test environment written in ESM with `.ts` extension', () => {
  const {exitCode, json} = runJestJson(DIR, ['testUsingTsEnv.test.js'], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  expect(exitCode).toBe(0);
  expect(json.numTotalTests).toBe(1);
  expect(json.numPassedTests).toBe(1);
});

it('support test environment written in ESM with `.mts` extension', () => {
  const {exitCode, json} = runJestJson(DIR, ['testUsingMtsEnv.test.js'], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  expect(exitCode).toBe(0);
  expect(json.numTotalTests).toBe(1);
  expect(json.numPassedTests).toBe(1);
});

it('support test environment written in ESM with `.js` extension', () => {
  const {exitCode, json} = runJestJson(DIR, ['testUsingJsEnv.test.js'], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  expect(exitCode).toBe(0);
  expect(json.numTotalTests).toBe(1);
  expect(json.numPassedTests).toBe(1);
});

it('support test environment written in ESM with `.mjs` extension', () => {
  const {exitCode, json} = runJestJson(DIR, ['testUsingMjsEnv.test.js'], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  expect(exitCode).toBe(0);
  expect(json.numTotalTests).toBe(1);
  expect(json.numPassedTests).toBe(1);
});
