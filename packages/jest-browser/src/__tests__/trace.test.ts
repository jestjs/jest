/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';
import * as path from 'node:path';

const runBrowserTestPath = path.resolve(__dirname, '../runBrowserTest.ts');
const configTypesPath = path.resolve(
  __dirname,
  '../../../jest-types/src/Config.ts',
);

describe('trace wiring', () => {
  const runBrowserTestSrc = fs.readFileSync(runBrowserTestPath, 'utf8');
  const configSrc = fs.readFileSync(configTypesPath, 'utf8');

  test('Config type includes trace option', () => {
    expect(configSrc).toContain("trace?: 'off' | 'on' | 'retain-on-failure'");
  });

  test('runBrowserTest reads trace config', () => {
    expect(runBrowserTestSrc).toContain('browserConfig?.trace');
  });

  test('runBrowserTest starts tracing when mode is not off', () => {
    expect(runBrowserTestSrc).toContain('context.tracing.start');
  });

  test('runBrowserTest stops tracing with path when saving', () => {
    expect(runBrowserTestSrc).toContain('context.tracing.stop({path:');
  });

  test('runBrowserTest saves to __traces__ directory', () => {
    expect(runBrowserTestSrc).toContain("'__traces__'");
  });

  test('retain-on-failure only saves when test failed', () => {
    expect(runBrowserTestSrc).toContain('retain-on-failure');
    expect(runBrowserTestSrc).toContain('finalBrowserResult.failed > 0');
  });
});
