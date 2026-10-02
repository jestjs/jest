/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Test} from '@jest/test-result';
import {createScriptTransformer} from '@jest/transform';
import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import type {Config} from '@jest/types';
import Resolver from 'jest-resolve';
import runGlobalHook from '../runGlobalHook';

jest.mock('@jest/transform', () => ({
  createScriptTransformer: jest.fn(),
}));

jest.mock('jest-resolve', () => ({
  __esModule: true,
  default: {unstable_shouldLoadAsEsm: jest.fn()},
}));

const setupPath = '/project/setup.ts';

function setRequireModuleSupport(value: boolean): void {
  // `jest-environment-node` forces this flag to `false` inside test
  // environments, so it has to be set explicitly
  Object.defineProperty(process.features, 'require_module', {
    configurable: true,
    enumerable: true,
    value,
  });
}

function makeAllTests(projectConfig: Config.ProjectConfig): Array<Test> {
  return [{context: {config: projectConfig}}] as unknown as Array<Test>;
}

describe('runGlobalHook', () => {
  const requireAndTranspileModule =
    jest.fn<
      (
        modulePath: string,
        callback: (module: unknown) => unknown,
        options?: unknown,
      ) => Promise<unknown>
    >();
  const hook = jest.fn();
  const globalConfig = makeGlobalConfig();
  const projectConfig = makeProjectConfig({
    extensionsToTreatAsEsm: ['.ts'],
    globalSetup: setupPath,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setRequireModuleSupport(false);

    requireAndTranspileModule.mockImplementation(
      async (_path: string, callback: (module: unknown) => unknown) =>
        callback(hook),
    );
    jest.mocked(createScriptTransformer).mockResolvedValue({
      requireAndTranspileModule,
    } as unknown as Awaited<ReturnType<typeof createScriptTransformer>>);
  });

  test('tells the transformer to keep an ES module hook as an ES module', async () => {
    setRequireModuleSupport(true);
    (Resolver.unstable_shouldLoadAsEsm as jest.Mock).mockReturnValue(true);

    await runGlobalHook({
      allTests: makeAllTests(projectConfig),
      globalConfig,
      moduleName: 'globalSetup',
    });

    expect(Resolver.unstable_shouldLoadAsEsm).toHaveBeenCalledWith(setupPath, [
      '.ts',
    ]);
    expect(requireAndTranspileModule).toHaveBeenCalledWith(
      setupPath,
      expect.any(Function),
      {
        applyInteropRequireDefault: true,
        instrument: false,
        supportsDynamicImport: true,
        supportsExportNamespaceFrom: true,
        supportsStaticESM: true,
        supportsTopLevelAwait: true,
      },
    );
    expect(hook).toHaveBeenCalledWith(globalConfig, projectConfig);
  });

  test('does not treat a hook as an ES module when `require(esm)` is unavailable', async () => {
    (Resolver.unstable_shouldLoadAsEsm as jest.Mock).mockReturnValue(true);

    await runGlobalHook({
      allTests: makeAllTests(projectConfig),
      globalConfig,
      moduleName: 'globalSetup',
    });

    expect(requireAndTranspileModule).toHaveBeenCalledWith(
      setupPath,
      expect.any(Function),
      undefined,
    );
  });

  test('does not treat a CommonJS hook as an ES module', async () => {
    setRequireModuleSupport(true);
    (Resolver.unstable_shouldLoadAsEsm as jest.Mock).mockReturnValue(false);

    await runGlobalHook({
      allTests: makeAllTests(projectConfig),
      globalConfig,
      moduleName: 'globalSetup',
    });

    expect(requireAndTranspileModule).toHaveBeenCalledWith(
      setupPath,
      expect.any(Function),
      undefined,
    );
  });
});
