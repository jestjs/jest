/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Script} from 'vm';
import type {Config, Global} from '@jest/types';
import {installCommonGlobals} from 'jest-util';
import {ModuleMocker} from 'jest-mock';
import {
  JestFakeTimers as LegacyFakeTimers,
  LolexFakeTimers,
} from '@jest/fake-timers';
import type {EnvironmentContext, JestEnvironment} from '@jest/environment';
import {JSDOM, VirtualConsole} from 'jsdom';

// The `Window` interface does not have an `Error.stackTraceLimit` property, but
// `JSDOMEnvironment` assumes it is there.
type Win = Window &
  Global.Global & {
    Error: {
      stackTraceLimit: number;
    };
  };

class JSDOMEnvironment implements JestEnvironment {
  dom: JSDOM | null;
  fakeTimers: LegacyFakeTimers<number> | null;
  fakeTimersLolex: LolexFakeTimers | null;
  global: Win;
  errorEventListener: ((event: Event & {error: Error}) => void) | null;
  moduleMocker: ModuleMocker | null;

  constructor(config: Config.ProjectConfig, options: EnvironmentContext = {}) {
    this.dom = new JSDOM('<!DOCTYPE html>', {
      pretendToBeVisual: true,
      runScripts: 'dangerously',
      url: config.testURL,
      virtualConsole: new VirtualConsole().sendTo(options.console || console),
      ...config.testEnvironmentOptions,
    });
    const global = (this.global = this.dom.window.document.defaultView as Win);

    if (!global) {
      throw new Error('JSDOM did not return a Window object');
    }

    // Node's error-message stack size is limited at 10, but it's pretty useful
    // to see more than that when a test fails.
    this.global.Error.stackTraceLimit = 100;
    installCommonGlobals(global as any, config.globals);

    // Report uncaught errors.
    this.errorEventListener = event => {
      if (userErrorListenerCount === 0 && event.error) {
        process.emit('uncaughtException', event.error);
      }
    };
    global.addEventListener('error', this.errorEventListener);

    // However, don't report them as uncaught if the user listens to 'error' event.
    // In that case, we assume the might have custom error handling logic.
    const originalAddListener = global.addEventListener;
    const originalRemoveListener = global.removeEventListener;
    let userErrorListenerCount = 0;
    global.addEventListener = function (
      ...args: Parameters<typeof originalAddListener>
    ) {
      if (args[0] === 'error') {
        userErrorListenerCount++;
      }
      return originalAddListener.apply(this, args);
    };
    global.removeEventListener = function (
      ...args: Parameters<typeof originalRemoveListener>
    ) {
      if (args[0] === 'error') {
        userErrorListenerCount--;
      }
      return originalRemoveListener.apply(this, args);
    };

    this.moduleMocker = new ModuleMocker(global as any);

    const timerConfig = {
      idToRef: (id: number) => id,
      refToId: (ref: number) => ref,
    };

    this.fakeTimers = new LegacyFakeTimers({
      config,
      global,
      moduleMocker: this.moduleMocker,
      timerConfig,
    });

    this.fakeTimersLolex = new LolexFakeTimers({config, global});
  }

  async setup(): Promise<void> {}

  async teardown(): Promise<void> {
    if (this.fakeTimers) {
      this.fakeTimers.dispose();
    }
    if (this.fakeTimersLolex) {
      this.fakeTimersLolex.dispose();
    }
    if (this.global) {
      if (this.errorEventListener) {
        this.global.removeEventListener('error', this.errorEventListener);
      }
      // Dispose "document" to prevent "load" event from triggering.
      Object.defineProperty(this.global, 'document', {value: null});
      this.global.close();
    }
    this.errorEventListener = null;
    // @ts-ignore
    this.global = null;
    this.dom = null;
    this.fakeTimers = null;
    this.fakeTimersLolex = null;
  }

  runScript<T = unknown>(script: Script): T | null {
    if (this.dom) {
      return this.dom.runVMScript(script) as any;
    }
    return null;
  }
}

export = JSDOMEnvironment;
