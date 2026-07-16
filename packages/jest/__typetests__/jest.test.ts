/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, test} from 'tstyche';
import type {
  Config,
  GlobalConfig as ExportedGlobalConfig,
  ProjectConfig as ExportedProjectConfig,
} from 'jest';

describe('Config', () => {
  test('is a reexport of the `InitialOptions`', () => {
    type InitialOptions = import('@jest/types').Config.InitialOptions;

    expect<Config>().type.toBe<InitialOptions>();
  });
});

describe('ExportedGlobalConfig', () => {
  test('is a reexport of the `GlobalConfig`', () => {
    type GlobalConfig = import('@jest/types').Config.GlobalConfig;

    expect<ExportedGlobalConfig>().type.toBe<GlobalConfig>();
  });
});

describe('ExportedProjectConfig', () => {
  test('is a reexport of the `ProjectConfig`', () => {
    type ProjectConfig = import('@jest/types').Config.ProjectConfig;

    expect<ExportedProjectConfig>().type.toBe<ProjectConfig>();
  });
});
