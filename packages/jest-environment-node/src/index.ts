/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type Context, createContext, runInContext} from 'vm';
import type {
  EnvironmentContext,
  JestEnvironment,
  JestEnvironmentConfig,
} from '@jest/environment';
import {LegacyFakeTimers, ModernFakeTimers} from '@jest/fake-timers';
import type {Global} from '@jest/types';
import {ModuleMocker} from 'jest-mock';
import {installCommonGlobals} from 'jest-util';

type Timer = {
  id: number;
  ref: () => Timer;
  unref: () => Timer;
};

// some globals we do not want, either because deprecated or we set it ourselves
const denyList = new Set([
  'GLOBAL',
  'root',
  'global',
  'globalThis',
  'Buffer',
  'ArrayBuffer',
  'Uint8Array',
  // if env is loaded within a jest test
  'jest-symbol-do-not-touch',
]);

type GlobalProperties = Array<keyof typeof globalThis>;

const nodeGlobals = new Map(
  (Object.getOwnPropertyNames(globalThis) as GlobalProperties)
    .filter(global => !denyList.has(global as string))
    .map(nodeGlobalsKey => {
      const descriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        nodeGlobalsKey,
      );

      if (!descriptor) {
        throw new Error(
          `No property descriptor for ${nodeGlobalsKey}, this is a bug in Jest.`,
        );
      }

      return [nodeGlobalsKey, descriptor];
    }),
);

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

const timerIdToRef = (id: number) => ({
  id,
  ref() {
    return this;
  },
  unref() {
    return this;
  },
});

const timerRefToId = (timer: Timer): number | undefined => timer?.id;

export default class NodeEnvironment implements JestEnvironment<Timer> {
  context: Context | null;
  fakeTimers: LegacyFakeTimers<Timer> | null;
  fakeTimersModern: ModernFakeTimers | null;
  global: Global.Global;
  moduleMocker: ModuleMocker | null;
  customExportConditions = ['node', 'node-addons'];
  private readonly _configuredExportConditions?: Array<string>;

  // while `context` is unused, it should always be passed
  constructor(config: JestEnvironmentConfig, _context: EnvironmentContext) {
    const {projectConfig} = config;
    this.context = createContext();

    const global = runInContext(
      'this',
      Object.assign(this.context, projectConfig.testEnvironmentOptions),
    ) as Global.Global;
    this.global = global;

    const contextGlobals = new Set(
      Object.getOwnPropertyNames(global) as GlobalProperties,
    );
    for (const [nodeGlobalsKey, descriptor] of nodeGlobals) {
      if (!contextGlobals.has(nodeGlobalsKey)) {
        if (descriptor.configurable) {
          Object.defineProperty(global, nodeGlobalsKey, {
            configurable: true,
            enumerable: descriptor.enumerable,
            get() {
              const value = globalThis[nodeGlobalsKey];

              // override lazy getter
              Object.defineProperty(global, nodeGlobalsKey, {
                configurable: true,
                enumerable: descriptor.enumerable,
                value,
                writable: true,
              });

              return value;
            },
            set(value: unknown) {
              // override lazy getter
              Object.defineProperty(global, nodeGlobalsKey, {
                configurable: true,
                enumerable: descriptor.enumerable,
                value,
                writable: true,
              });
            },
          });
        } else if ('value' in descriptor) {
          Object.defineProperty(global, nodeGlobalsKey, {
            configurable: false,
            enumerable: descriptor.enumerable,
            value: descriptor.value,
            writable: descriptor.writable,
          });
        } else {
          Object.defineProperty(global, nodeGlobalsKey, {
            configurable: false,
            enumerable: descriptor.enumerable,
            get: descriptor.get,
            set: descriptor.set,
          });
        }
      }
    }

    global.global = global;
    global.Buffer = Buffer;
    global.ArrayBuffer = ArrayBuffer;
    // TextEncoder (global or via 'util') references a Uint8Array constructor
    // different than the global one used by users in tests. This makes sure the
    // same constructor is referenced by both.
    global.Uint8Array = Uint8Array;

    installCommonGlobals(global, projectConfig.globals);

    if ('asyncDispose' in Symbol && !('asyncDispose' in global.Symbol)) {
      const globalSymbol = global.Symbol as unknown as SymbolConstructor;
      // @ts-expect-error - it's readonly - but we have checked above that it's not there
      globalSymbol.asyncDispose = globalSymbol.for('nodejs.asyncDispose');
      // @ts-expect-error - it's readonly - but we have checked above that it's not there
      globalSymbol.dispose = globalSymbol.for('nodejs.dispose');
    }

    // Node's error-message stack size is limited at 10, but it's pretty useful
    // to see more than that when a test fails.
    global.Error.stackTraceLimit = 100;

    if ('customExportConditions' in projectConfig.testEnvironmentOptions) {
      const {customExportConditions} = projectConfig.testEnvironmentOptions;
      if (
        Array.isArray(customExportConditions) &&
        customExportConditions.every(isString)
      ) {
        this._configuredExportConditions = customExportConditions;
      } else {
        throw new Error(
          'Custom export conditions specified but they are not an array of strings',
        );
      }
    }

    this.moduleMocker = new ModuleMocker(global);

    this.fakeTimers = new LegacyFakeTimers({
      config: projectConfig,
      global,
      moduleMocker: this.moduleMocker,
      timerConfig: {
        idToRef: timerIdToRef,
        refToId: timerRefToId,
      },
    });

    this.fakeTimersModern = new ModernFakeTimers({
      config: projectConfig,
      global,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async setup(): Promise<void> {}

  async teardown(): Promise<void> {
    if (this.fakeTimers) {
      this.fakeTimers.dispose();
    }
    if (this.fakeTimersModern) {
      this.fakeTimersModern.dispose();
    }
    this.context = null;
    this.fakeTimers = null;
    this.fakeTimersModern = null;
  }

  exportConditions(): Array<string> {
    return this._configuredExportConditions ?? this.customExportConditions;
  }

  getVmContext(): Context | null {
    return this.context;
  }
}

export const TestEnvironment = NodeEnvironment;
