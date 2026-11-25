/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {beforeEach, expect, it, jest} from '@jest/globals';
import type {JestEnvironment} from '@jest/environment';
import type {Circus, Config} from '@jest/types';
import type Runtime from 'jest-runtime';
import {getState as getRunnerState} from '../../state';
import {eventHandler, initialize} from '../jestAdapterInit';

beforeEach(() => expect.hasAssertions());

it("pushes a hasAssertion() error if there's no assertions/errors", () => {
  const event: Circus.Event = {
    name: 'test_done',
    test: {errors: []} as unknown as Circus.TestEntry,
  };
  const beforeLength = event.test.errors.length;

  eventHandler(event);

  expect(event.test.errors).toHaveLength(beforeLength + 1);
  expect(event.test.errors).toEqual([
    expect.getState().isExpectingAssertionsError,
  ]);
});

it("omits hasAssertion() errors if there's already an error", () => {
  const errors = [new Error('ruh roh'), new Error('not good')];
  const event: Circus.Event = {
    name: 'test_done',
    test: {errors} as unknown as Circus.TestEntry,
  };
  const beforeLength = event.test.errors.length;

  eventHandler(event);

  expect(event.test.errors).toHaveLength(beforeLength);
  expect(event.test.errors).not.toContain(
    expect.getState().isExpectingAssertionsError,
  );

  // Ensure test state is not accidentally leaked by e.g. not calling extractExpectedAssertionsErrors() at all.
  expect(expect.getState().isExpectingAssertions).toBe(false);
});

const runInitialize = async (testTimeout?: number) => {
  const config = {
    injectGlobals: false,
    prettierPath: 'prettier',
    rootDir: __dirname,
    snapshotFormat: {},
    snapshotSerializers: [],
    ...(testTimeout === undefined ? {} : {testTimeout}),
  } as unknown as Config.ProjectConfig;
  const globalConfig = {
    expand: false,
    maxConcurrency: 5,
    testTimeout: 10_000,
  } as unknown as Config.GlobalConfig;

  await initialize({
    config,
    environment: {global: {}} as unknown as JestEnvironment,
    globalConfig,
    localRequire: jest.fn() as unknown as <T = unknown>(path: string) => T,
    parentProcess: process,
    runtime: {
      enterTestCode: jest.fn(),
      leaveTestCode: jest.fn(),
    } as unknown as Runtime,
    setGlobalsForRuntime: jest.fn(),
    testPath: __filename,
  });
};

it('applies config.testTimeout over globalConfig.testTimeout in initialize', async () => {
  await runInitialize(2000);

  expect(getRunnerState().testTimeout).toBe(2000);
});

it('falls back to globalConfig.testTimeout when config.testTimeout is not set', async () => {
  await runInitialize();

  expect(getRunnerState().testTimeout).toBe(10_000);
});
