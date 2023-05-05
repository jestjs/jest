/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import {createScriptTransformer} from '@jest/transform';
import NodeEnvironment from 'jest-environment-node';
import {tryRealpath} from 'jest-util';
import Runtime from '../';

// Copy from jest-config (since we don't want to depend on this package)
const getCacheDirectory = () => {
  const {getuid} = process;
  const tmpdirPath = path.join(tryRealpath(tmpdir()), 'jest');
  if (getuid == null) {
    return tmpdirPath;
  } else {
    // On some platforms tmpdir() is `/tmp`, causing conflicts between different
    // users and permission issues. Adding an additional subdivision by UID can
    // help.
    return `${tmpdirPath}_${getuid.call(process).toString(36)}`;
  }
};

const setupModuleNameMapper = (config, rootDir) => {
  if (config && config.moduleNameMapper) {
    return Object.keys(config.moduleNameMapper).map(regex => {
      const item = config.moduleNameMapper && config.moduleNameMapper[regex];
      return item && [regex, item.replace('<rootDir>', rootDir)];
    });
  }
  return [];
};

const setupTransform = (config, rootDir, cwd) => {
  if (config?.transform) {
    const transform = config.transform;
    return Object.keys(transform).map(regex => [
      regex,
      path.resolve(rootDir, transform[regex]),
    ]);
  }
  return [['^.+\\.[jt]sx?$', require.resolve('babel-jest'), {root: cwd}]];
};

module.exports = async function createRuntime(filename, projectConfig) {
  const rootDir = path.resolve(path.dirname(filename), 'test_root');
  const cwd = path.resolve(__dirname, '../../../..');

  const moduleNameMapper = setupModuleNameMapper(projectConfig, rootDir);
  const transform = setupTransform(projectConfig, rootDir, cwd);

  const globalConfig = makeGlobalConfig();

  projectConfig = makeProjectConfig({
    cacheDirectory: getCacheDirectory(),
    cwd,
    haste: {
      hasteImplModulePath: require.resolve(
        '../../../jest-haste-map/src/__tests__/haste_impl.js',
      ),
    },
    id: `Runtime-${filename.replace(/\W/, '-')}.tests`,
    moduleDirectories: ['node_modules'],
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
    rootDir,
    ...projectConfig,
    moduleNameMapper,
    transform,
  });

  if (!projectConfig.roots.length) {
    projectConfig.roots = [projectConfig.rootDir];
  }

  const environment = new NodeEnvironment({
    globalConfig,
    projectConfig,
  });
  environment.global.console = console;

  const hasteMap = await (
    await Runtime.createHasteMap(projectConfig, {
      maxWorkers: 1,
      resetCache: false,
    })
  ).build();

  const cacheFS = new Map();
  const scriptTransformer = await createScriptTransformer(
    projectConfig,
    cacheFS,
  );

  const runtime = new Runtime(
    projectConfig,
    environment,
    Runtime.createResolver(projectConfig, hasteMap.moduleMap),
    scriptTransformer,
    cacheFS,
    {
      changedFiles: undefined,
      collectCoverage: false,
      collectCoverageFrom: [],
      coverageProvider: 'v8',
      sourcesRelatedToTestsInChangedFiles: undefined,
    },
    filename,
    globalConfig,
  );

  for (const path of projectConfig.setupFiles) {
    const esm = runtime.unstable_shouldLoadAsEsm(path);

    if (esm) {
      await runtime.unstable_importModule(path);
    } else {
      runtime.requireModule(path);
    }
  }

  runtime.__mockRootPath = path.join(projectConfig.rootDir, 'root.js');
  runtime.__mockSubdirPath = path.join(
    projectConfig.rootDir,
    'subdir2',
    'module_dir',
    'module_dir_module.js',
  );
  return runtime;
};
