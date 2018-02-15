/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {GlobalConfig} from 'types/Config';
import type {JestHookSubscriber} from './jest_hooks';

export type UsageData = {
  key: number,
  prompt: string,
};

export type JestHooks = {
  testRunComplete: any,
};

export type WatchPlugin = {
  apply?: (hooks: JestHookSubscriber) => void,
  getUsageData?: (globalConfig: GlobalConfig) => ?UsageData,
  onKey?: (value: string) => void,
  runInteractive?: (
    globalConfig: GlobalConfig,
    updateConfigAndRun: Function,
  ) => Promise<void | boolean>,
};
