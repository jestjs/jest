/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectAssignable, expectError, expectType} from 'tsd-lite';
import type {Config} from '@jest/types';
import {JestConfig, defaults, defineConfig} from 'jest-config';

// defineConfig()

expectType<Promise<Config.InitialOptions>>(defineConfig({}));
expectType<Promise<Config.InitialOptions>>(defineConfig({...defaults}));
expectType<Promise<Config.InitialOptions>>(defineConfig({verbose: true}));

expectType<Promise<Config.InitialOptions>>(defineConfig(() => ({})));
expectType<Promise<Config.InitialOptions>>(defineConfig(() => ({...defaults})));
expectType<Promise<Config.InitialOptions>>(
  defineConfig(() => ({verbose: true})),
);

expectType<Promise<Config.InitialOptions>>(defineConfig(async () => ({})));
expectType<Promise<Config.InitialOptions>>(
  defineConfig(async () => ({...defaults})),
);
expectType<Promise<Config.InitialOptions>>(
  defineConfig(async () => ({verbose: true})),
);

expectError(defineConfig());
expectError(defineConfig(() => {}));
expectError(defineConfig(async () => {}));
expectError(defineConfig({fakeTimers: true}));

// JestConfig

expectAssignable<Config.InitialOptions>({} as JestConfig);
