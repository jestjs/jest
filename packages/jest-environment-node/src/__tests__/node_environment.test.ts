/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {EnvironmentContext} from '@jest/environment';
import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import NodeEnvironment from '../';

const context: EnvironmentContext = {
  console,
  docblockPragmas: {},
  testPath: __filename,
};

describe('NodeEnvironment', () => {
  it('uses a copy of the process object', () => {
    const testEnvConfig = {
      globalConfig: makeGlobalConfig(),
      projectConfig: makeProjectConfig(),
    };
    const env1 = new NodeEnvironment(testEnvConfig, context);
    const env2 = new NodeEnvironment(testEnvConfig, context);

    expect(env1.global.process).not.toBe(env2.global.process);
  });

  it('exposes process.on', () => {
    const env1 = new NodeEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      context,
    );

    expect(env1.global.process.on).not.toBeNull();
  });

  it('exposes global.global', () => {
    const env1 = new NodeEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      context,
    );

    expect(env1.global.global).toBe(env1.global);
  });

  it('should configure setTimeout/setInterval to use the node api', () => {
    const env1 = new NodeEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      context,
    );

    env1.fakeTimers!.useFakeTimers();

    const timer1 = env1.global.setTimeout(() => {}, 0);
    const timer2 = env1.global.setInterval(() => {}, 0);

    [timer1, timer2].forEach(timer => {
      expect(timer.id).toBeDefined();
      expect(typeof timer.ref).toBe('function');
      expect(typeof timer.unref).toBe('function');
    });
  });

  it('has modern fake timers implementation', () => {
    const env = new NodeEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      context,
    );

    expect(env.fakeTimersModern).toBeDefined();
  });

  test('TextEncoder references the same global Uint8Array constructor', () => {
    expect(new TextEncoder().encode('abc')).toBeInstanceOf(Uint8Array);
  });
});
