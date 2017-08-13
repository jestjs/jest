/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {MockData} from 'types/Mock';
type GenMockFn = (implementation?: Function) => JestMockFn;
type JestMockFn = Function;

export type LocalModuleRequire = (moduleName: string) => any;

export type Jest = {|
  addMatchers(matchers: Object): void,
  autoMockOff(): Jest,
  autoMockOn(): Jest,
  clearAllMocks(): Jest,
  clearAllTimers(): void,
  deepUnmock(moduleName: string): Jest,
  disableAutomock(): Jest,
  doMock(moduleName: string, moduleFactory?: any): Jest,
  dontMock(moduleName: string): Jest,
  enableAutomock(): Jest,
  fn: GenMockFn,
  genMockFn: GenMockFn,
  genMockFromModule(moduleName: string): any,
  genMockFunction: GenMockFn,
  getMock(mockFn: JestMockFn): MockData,
  isMockFunction(fn: Function): boolean,
  mock(moduleName: string, moduleFactory?: any, options?: Object): Jest,
  requireActual: LocalModuleRequire,
  resetAllMocks(): Jest,
  resetModuleRegistry(): Jest,
  resetModules(): Jest,
  runAllImmediates(): void,
  runAllTicks(): void,
  runAllTimers(): void,
  runOnlyPendingTimers(): void,
  runTimersToTime(msToRun: number): void,
  setMock(moduleName: string, moduleExports: any): Jest,
  setTimeout(timeout: number): Jest,
  spyOn(object: Object, methodName: string): JestMockFn,
  stub(object: Object, propertyName: string, impl?: Function): JestMockFn,
  unmock(moduleName: string): Jest,
  useFakeTimers(): Jest,
  useRealTimers(): Jest,
|};
