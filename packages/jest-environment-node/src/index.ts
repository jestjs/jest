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
import {
  installCommonGlobals,
  isShreddable,
  setNotShreddable,
  shred,
} from 'jest-util';

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
  private _globalProxy: GlobalProxy;

  // while `context` is unused, it should always be passed
  constructor(config: JestEnvironmentConfig, _context: EnvironmentContext) {
    const {projectConfig} = config;
    this._globalProxy = new GlobalProxy();
    this.context = createContext(this._globalProxy.proxy());
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

    this._globalProxy.envSetupCompleted();
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
    this._globalProxy.clear();
  }

  exportConditions(): Array<string> {
    return this._configuredExportConditions ?? this.customExportConditions;
  }

  getVmContext(): Context | null {
    return this.context;
  }
}

export const TestEnvironment = NodeEnvironment;

/**
 * Creates a new empty global object and wraps it with a {@link Proxy}.
 *
 * The purpose is to register any property set on the global object,
 * and {@link #shred} them at environment teardown, to clean up memory and
 * prevent leaks.
 */
class GlobalProxy implements ProxyHandler<typeof globalThis> {
  private global: typeof globalThis = Object.create(
    Object.getPrototypeOf(globalThis),
  );
  private globalProxy: typeof globalThis = new Proxy(this.global, this);
  private isEnvSetup = false;
  private propertyToValue = new Map<string | symbol, unknown>();
  private leftovers: Array<{property: string | symbol; value: unknown}> = [];

  constructor() {
    this.register = this.register.bind(this);
  }

  proxy(): typeof globalThis {
    return this.globalProxy;
  }

  /**
   * Marks that the environment setup has completed, and properties set on
   * the global object from now on should be shredded at teardown.
   */
  envSetupCompleted(): void {
    this.isEnvSetup = true;
  }

  /**
   * Shreds any property that was set on the global object, except for:
   * 1. Properties that were set before {@link #envSetupCompleted} was invoked.
   * 2. Properties protected by {@link #setNotShreddable}.
   */
  clear(): void {
    for (const {property, value} of [
      ...[...this.propertyToValue.entries()].map(([property, value]) => ({
        property,
        value,
      })),
      ...this.leftovers,
    ]) {
      /*
       * react-native invoke its custom `performance` property after env teardown.
       * its setup file should use `setNotShreddable` to prevent this.
       */
      if (property !== 'performance') {
        shred(value);
      }
    }
    this.propertyToValue.clear();
    this.leftovers = [];
    this.global = {} as typeof globalThis;
    this.globalProxy = {} as typeof globalThis;
  }

  defineProperty(
    target: typeof globalThis,
    property: string | symbol,
    attributes: PropertyDescriptor,
  ): boolean {
    const newAttributes = {...attributes};

    if ('set' in newAttributes && newAttributes.set !== undefined) {
      const originalSet = newAttributes.set;
      const register = this.register;
      newAttributes.set = value => {
        originalSet(value);
        const newValue = Reflect.get(target, property);
        register(property, newValue);
      };
    }

    const result = Reflect.defineProperty(target, property, newAttributes);

    if ('value' in newAttributes) {
      this.register(property, newAttributes.value);
    }

    return result;
  }

  deleteProperty(
    target: typeof globalThis,
    property: string | symbol,
  ): boolean {
    const result = Reflect.deleteProperty(target, property);
    const value = this.propertyToValue.get(property);
    if (value) {
      this.leftovers.push({property, value});
      this.propertyToValue.delete(property);
    }
    return result;
  }

  private register(property: string | symbol, value: unknown) {
    const currentValue = this.propertyToValue.get(property);
    if (value !== currentValue) {
      if (!this.isEnvSetup && isShreddable(value)) {
        setNotShreddable(value);
      }
      if (currentValue) {
        this.leftovers.push({property, value: currentValue});
      }

      this.propertyToValue.set(property, value);
    }
  }
}
