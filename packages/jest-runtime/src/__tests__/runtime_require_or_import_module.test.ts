/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {requireOrImportModule as requireOrImportModuleOutsideVm} from 'jest-util';
import Runtime from '../';

jest.mock('jest-util', () => {
  const actual = jest.requireActual<typeof import('jest-util')>('jest-util');

  return {
    ...actual,
    requireOrImportModule: jest.fn(async (modulePath: string) => ({
      loadedModulePath: modulePath,
    })),
  };
});

const ROOT_DIR = path.join(__dirname, 'test_esm_sync_graph_root');

const makeRuntime = ({
  importedModule,
  modulePath,
  requiredModule,
  shouldLoadAsEsm = false,
}: {
  importedModule?: unknown;
  modulePath: string;
  requiredModule?: unknown;
  shouldLoadAsEsm?: boolean;
}) =>
  ({
    _resolution: {
      resolveEsmAsync: jest.fn(async () => modulePath),
      shouldLoadAsEsm: jest.fn(() => shouldLoadAsEsm),
    },
    requireModule: jest.fn(() => requiredModule),
    unstable_importModule: jest.fn(async () => importedModule),
  }) as any;

describe('Runtime.requireOrImportModule', () => {
  beforeEach(() => {
    jest.mocked(requireOrImportModuleOutsideVm).mockClear();
  });

  it('loads .mjs and .mts modules outside the Jest VM', async () => {
    const mjsPath = path.join(ROOT_DIR, 'plugin.mjs');
    const mtsPath = path.join(ROOT_DIR, 'plugin.mts');
    const from = path.join(ROOT_DIR, 'from.js');

    await expect(
      Runtime.prototype.requireOrImportModule.call(
        makeRuntime({modulePath: mjsPath}),
        from,
        './plugin.mjs',
      ),
    ).resolves.toEqual({loadedModulePath: mjsPath});
    await expect(
      Runtime.prototype.requireOrImportModule.call(
        makeRuntime({modulePath: mtsPath}),
        from,
        './plugin.mts',
      ),
    ).resolves.toEqual({loadedModulePath: mtsPath});

    expect(requireOrImportModuleOutsideVm).toHaveBeenCalledWith(mjsPath);
    expect(requireOrImportModuleOutsideVm).toHaveBeenCalledWith(mtsPath);
  });

  it('loads VM ESM modules through their default export', async () => {
    const modulePath = path.join(ROOT_DIR, 'resolved-esm.js');
    const runtime = makeRuntime({
      importedModule: {default: {esmValue: 'from-vm'}},
      modulePath,
      shouldLoadAsEsm: true,
    });

    await expect(
      Runtime.prototype.requireOrImportModule.call(
        runtime,
        path.join(ROOT_DIR, 'from.js'),
        './resolved-esm.js',
      ),
    ).resolves.toEqual({esmValue: 'from-vm'});
  });

  it('rejects VM ESM modules without a default export', async () => {
    const modulePath = path.join(ROOT_DIR, 'resolved-esm.js');

    await expect(
      Runtime.prototype.requireOrImportModule.call(
        makeRuntime({importedModule: null, modulePath, shouldLoadAsEsm: true}),
        path.join(ROOT_DIR, 'from.js'),
        './resolved-esm.js',
      ),
    ).rejects.toThrow('did you use a default export?');
    await expect(
      Runtime.prototype.requireOrImportModule.call(
        makeRuntime({
          importedModule: {named: 'only'},
          modulePath,
          shouldLoadAsEsm: true,
        }),
        path.join(ROOT_DIR, 'from.js'),
        './resolved-esm.js',
      ),
    ).rejects.toThrow('did you use a default export?');
  });

  it('loads CJS modules through requireModule', async () => {
    const from = path.join(ROOT_DIR, 'from.js');
    const requiredModule = {cjsValue: 'from-cjs'};
    const runtime = makeRuntime({modulePath: from, requiredModule});

    await expect(
      Runtime.prototype.requireOrImportModule.call(runtime, from),
    ).resolves.toBe(requiredModule);

    expect(runtime._resolution.resolveEsmAsync).not.toHaveBeenCalled();
    expect(runtime.requireModule).toHaveBeenCalledWith(from, undefined);
  });
});
