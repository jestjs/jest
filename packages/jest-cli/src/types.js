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

export type UsageRow = {
  key: number,
  prompt: string,
  hide?: boolean,
};

export type JestHooks = {
  testRunComplete: any,
};

export type WatchPlugin = {
  registerHooks?: (hooks: JestHookSubscriber) => void,
  getUsageRow?: (globalConfig: GlobalConfig) => UsageRow,
  onData?: (value: string) => void,
  showPrompt?: (
    globalConfig: GlobalConfig,
    updateConfigAndRun: Function,
  ) => Promise<void | boolean>,
};
