/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import NodeEnvironment from 'jest-environment-node';
import Runtime from '../';

jest.mock('jest-haste-map');

describe('Runtime constructor', () => {
  it('throws a descriptive error when moduleMocker lacks clearMocksOnScope', async () => {
    const globalConfig = makeGlobalConfig();
    const projectConfig = makeProjectConfig({
      cacheDirectory: '/tmp/jest-incompatible-env-test',
      haste: {},
    });

    const environment = new NodeEnvironment(
      {globalConfig, projectConfig},
      {console, docblockPragmas: {}, testPath: __filename},
    );

    // Simulate an old moduleMocker (e.g. from jest-environment-jsdom@29.x using
    // jest-mock@29.x) that does not have clearMocksOnScope
    Object.defineProperty(environment.moduleMocker, 'clearMocksOnScope', {
      configurable: true,
      value: undefined,
    });

    expect(() => {
      new Runtime(
        projectConfig,
        environment,
        null as any,
        null as any,
        new Map(),
        {
          changedFiles: undefined,
          collectCoverage: false,
          collectCoverageFrom: [],
          coverageProvider: 'v8',
          sourcesRelatedToTestsInChangedFiles: undefined,
        },
        __filename,
        globalConfig,
      );
    }).toThrow(
      "The test environment's `moduleMocker` is not compatible with this version of Jest. " +
        '`clearMocksOnScope` is required but not available. ' +
        'Please ensure your test environment (e.g., `jest-environment-jsdom`) uses a compatible version of `jest-mock` (>=30.4.0).',
    );

    await environment.teardown();
  });
});
