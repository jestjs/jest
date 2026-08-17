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

    for (const timer of [timer1, timer2]) {
      expect(timer.id).toBeDefined();
      expect(typeof timer.ref).toBe('function');
      expect(typeof timer.unref).toBe('function');
    }
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

describe('globals cleanup', () => {
  const makeEnvironment = (globalsCleanup: string) =>
    new NodeEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig({
          testEnvironmentOptions: {globalsCleanup},
        }),
      },
      context,
    );

  it.each(['on', 'soft', 'off'])(
    'leaves host globals intact after teardown in %s mode',
    async globalsCleanup => {
      const env = makeEnvironment(globalsCleanup);

      await env.teardown();

      expect(typeof process.nextTick).toBe('function');
      expect(typeof console.log).toBe('function');
      expect(typeof Object.prototype.hasOwnProperty).toBe('function');
      expect(typeof Reflect.get).toBe('function');
    },
  );
});

describe('lazy globals', () => {
  const property = 'lazyGlobalProbe';
  let resolutions: number;

  // Node 26 exposes the builtin modules as lazy globals, which must not be
  // resolved just because an environment was constructed.
  const loadEnvironmentWithLazyGlobal = () => {
    resolutions = 0;
    Object.defineProperty(globalThis, property, {
      configurable: true,
      enumerable: false,
      get() {
        resolutions++;
        return {module: property};
      },
    });

    let Environment: typeof NodeEnvironment;
    jest.isolateModules(() => {
      Environment = require('../').default;
    });
    return Environment!;
  };

  afterEach(() => {
    // @ts-expect-error: probe property
    delete globalThis[property];
  });

  it('does not resolve a lazy global when constructing an environment', () => {
    const Environment = loadEnvironmentWithLazyGlobal();

    const env = new Environment(
      {globalConfig: makeGlobalConfig(), projectConfig: makeProjectConfig()},
      context,
    );

    expect(env.global).toBeDefined();
    expect(resolutions).toBe(0);
    expect(
      Object.getOwnPropertyDescriptor(globalThis, property),
    ).toHaveProperty('get');
  });

  it('resolves a lazy global once it is read in the sandbox', () => {
    const Environment = loadEnvironmentWithLazyGlobal();

    const env = new Environment(
      {globalConfig: makeGlobalConfig(), projectConfig: makeProjectConfig()},
      context,
    );

    // @ts-expect-error: probe property
    expect(env.global[property]).toEqual({module: property});
    expect(resolutions).toBe(1);
  });
});
