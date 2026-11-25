/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {JestEnvironment} from '@jest/environment';
import type {Config} from '@jest/types';
import type Runtime from 'jest-runtime';
import jasmine2 from '../index';

test('jasmine2 passes config.testTimeout over globalConfig.testTimeout', async () => {
  let createdOptions: Record<string, any> | undefined;
  const mockJasmine = {
    _DEFAULT_TIMEOUT_INTERVAL: 2000,
    addReporter: jest.fn(),
    getEnv: jest.fn(() => ({
      addReporter: jest.fn(),
      addSpecFilter: jest.fn(),
      beforeEach: jest.fn(),
      execute: jest.fn((_testPath, onComplete: any) => onComplete?.()),
    })),
  };
  const mockRuntime = {
    requireInternalModule: jest.fn(() => ({
      _interface: jest.fn(() => ({jsApiReporter: {}})),
      create: jest.fn((options: Record<string, any>) => {
        createdOptions = options;
        return mockJasmine;
      }),
    })),
  } as unknown as Runtime;

  const globalConfig = {testTimeout: 5000} as Config.GlobalConfig;
  const config = {
    snapshotSerializers: [],
    testTimeout: 2000,
  } as unknown as Config.ProjectConfig;
  const environment = {global: {}} as unknown as JestEnvironment;

  await jasmine2(
    globalConfig,
    config,
    environment,
    mockRuntime,
    __filename,
  ).catch(() => {});

  expect(createdOptions?.testTimeout).toBe(2000);
});

test('jasmine2 falls back to globalConfig.testTimeout when config.testTimeout is not set', async () => {
  let createdOptions: Record<string, any> | undefined;
  const mockJasmine = {
    _DEFAULT_TIMEOUT_INTERVAL: 5000,
    addReporter: jest.fn(),
    getEnv: jest.fn(() => ({
      addReporter: jest.fn(),
      addSpecFilter: jest.fn(),
      beforeEach: jest.fn(),
      execute: jest.fn((_testPath, onComplete: any) => onComplete?.()),
    })),
  };
  const mockRuntime = {
    requireInternalModule: jest.fn(() => ({
      _interface: jest.fn(() => ({jsApiReporter: {}})),
      create: jest.fn((options: Record<string, any>) => {
        createdOptions = options;
        return mockJasmine;
      }),
    })),
  } as unknown as Runtime;

  const globalConfig = {testTimeout: 5000} as Config.GlobalConfig;
  const config = {
    snapshotSerializers: [],
  } as unknown as Config.ProjectConfig;
  const environment = {global: {}} as unknown as JestEnvironment;

  await jasmine2(
    globalConfig,
    config,
    environment,
    mockRuntime,
    __filename,
  ).catch(() => {});

  expect(createdOptions?.testTimeout).toBe(5000);
});
