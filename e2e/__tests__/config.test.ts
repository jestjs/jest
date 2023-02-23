/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest, {getConfig} from '../runJest';

test('config as JSON', () => {
  const result = runJest('verbose-reporter', [
    `--config=${JSON.stringify({
      testEnvironment: 'node',
      testMatch: ['banana strawberry kiwi'],
    })}`,
  ]);

  expect(result.exitCode).toBe(1);
  expect(result.stdout).toMatch('No tests found');
});

test('works with sane config JSON', () => {
  const result = runJest('verbose-reporter', [
    `--config=${JSON.stringify({
      testEnvironment: 'node',
    })}`,
  ]);

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toMatch('works just fine');
});

test('watchman config option is respected over default argv', () => {
  const {stdout} = runJest('verbose-reporter', [
    '--env=node',
    '--watchman=false',
    '--debug',
  ]);

  expect(stdout).toMatch('"watchman": false');
});

test('config from argv is respected with sane config JSON', () => {
  const {stdout} = runJest('verbose-reporter', [
    `--config=${JSON.stringify({
      testEnvironment: 'node',
      watchman: false,
    })}`,
    '--debug',
  ]);

  expect(stdout).toMatch('"watchman": false');
});

test('works with jsdom testEnvironmentOptions config JSON', () => {
  const result = runJest('environmentOptions', [
    `--config=${JSON.stringify({
      testEnvironment: 'jsdom',
      testEnvironmentOptions: {
        url: 'https://jestjs.io',
      },
    })}`,
  ]);

  expect(result.exitCode).toBe(0);
  expect(result.stderr).toContain('found url jestjs.io');
});

test('negated flags override previous flags', () => {
  const {globalConfig} = getConfig('verbose-reporter', [
    '--silent',
    '--no-silent',
    '--silent',
  ]);

  expect(globalConfig.silent).toBe(true);
});
