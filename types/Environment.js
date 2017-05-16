/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {ProjectConfig} from './Config';
import type {Global} from './Global';
import type {Script} from 'vm';
import type {ModuleMocker} from 'jest-mock';

declare class $JestEnvironment {
  constructor(config: ProjectConfig): void,
  dispose(): void,
  runScript(script: Script): any,
  global: Global,
  fakeTimers: {
    clearAllTimers(): void,
    runAllImmediates(): void,
    runAllTicks(): void,
    runAllTimers(): void,
    runTimersToTime(): void,
    runOnlyPendingTimers(): void,
    runWithRealTimers(callback: any): void,
    useFakeTimers(): void,
    useRealTimers(): void,
  },
  testFilePath: string,
  moduleMocker: ModuleMocker,
}

export type Environment = $JestEnvironment;
export type EnvironmentClass = typeof $JestEnvironment;
