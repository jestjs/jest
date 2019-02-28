/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Script} from 'vm';
import {Global, Config} from '@jest/types';
import mock, {ModuleMocker} from 'jest-mock';
import {installCommonGlobals} from 'jest-util';
import {JestFakeTimers as FakeTimers} from '@jest/fake-timers';
import {
  JestEnvironment,
  EnvironmentContext,
  RunScriptResult,
} from '@jest/environment';
import {JSDOM, VirtualConsole} from 'jsdom';

// The `Window` interface does not have an `Error.stackTraceLimit` property, but
// `JSDOMEnvironment` assumes it is there.
interface Win extends Window {
  Error: {
    stackTraceLimit: number;
  };
}

function isWin(globals: Win | Global.Global): globals is Win {
  return (globals as Win).document !== undefined;
}

class JSDOMEnvironment implements JestEnvironment {
  dom: JSDOM | null;
  fakeTimers: FakeTimers<number> | null;
  // @ts-ignore
  global: Global.Global | Win | null;
  errorEventListener: ((event: Event & {error: unknown}) => void) | null;
  moduleMocker: ModuleMocker | null;

  constructor(config: Config.ProjectConfig, options: EnvironmentContext = {}) {
    this.dom = new JSDOM('<!DOCTYPE html>', {
      pretendToBeVisual: true,
      runScripts: 'dangerously',
      url: config.testURL,
      virtualConsole: new VirtualConsole().sendTo(options.console || console),
      ...config.testEnvironmentOptions,
    });

    // `defaultView` returns a `Window` type, which is missing the
    // `Error.stackTraceLimit` property. See the `Win` interface above.
    const global = (this.global = this.dom.window.document
      .defaultView as Win | null);

    if (!global || !this.global) {
      this.fakeTimers = null;
      this.errorEventListener = null;
      this.moduleMocker = null;
      return;
    }

    // Node's error-message stack size is limited at 10, but it's pretty useful
    // to see more than that when a test fails.
    this.global.Error.stackTraceLimit = 100;
    // `global` is of type `Win`, but `installCommonGlobals` expects
    // `NodeJS.Global`, so using `any` for now
    installCommonGlobals(global as any, config.globals);

    // Report uncaught errors.
    this.errorEventListener = event => {
      if (userErrorListenerCount === 0 && event.error) {
        (process as NodeJS.EventEmitter).emit('uncaughtException', event.error);
      }
    };
    global.addEventListener('error', this.errorEventListener);

    // However, don't report them as uncaught if the user listens to 'error' event.
    // In that case, we assume the might have custom error handling logic.
    const originalAddListener = global.addEventListener;
    const originalRemoveListener = global.removeEventListener;
    let userErrorListenerCount = 0;
    global.addEventListener = function(name: string) {
      if (name === 'error') {
        userErrorListenerCount++;
      }
      // TODO: remove `any` type assertion
      return originalAddListener.apply(this, arguments as any);
    };
    global.removeEventListener = function(name: string) {
      if (name === 'error') {
        userErrorListenerCount--;
      }
      // TODO: remove `any` type assertion
      return originalRemoveListener.apply(this, arguments as any);
    };

    // `global` is of type `Win`, but `ModuleMocker` expects `NodeJS.Global`, so
    // using `any` for now
    this.moduleMocker = new mock.ModuleMocker(global as any);

    const timerConfig = {
      idToRef: (id: number) => id,
      refToId: (ref: number) => ref,
    };

    this.fakeTimers = new FakeTimers({
      config,
      // `global` is of type `Win`, but `FakeTimers` expects `NodeJS.Global`, so
      // using `any` for now
      global: global as any,
      moduleMocker: this.moduleMocker,
      timerConfig,
    });
  }

  setup() {
    return Promise.resolve();
  }

  teardown() {
    if (this.fakeTimers) {
      this.fakeTimers.dispose();
    }
    if (this.global) {
      if (this.errorEventListener && isWin(this.global)) {
        this.global.removeEventListener('error', this.errorEventListener);
      }
      // Dispose "document" to prevent "load" event from triggering.
      Object.defineProperty(this.global, 'document', {value: null});
      if (isWin(this.global)) {
        this.global.close();
      }
    }
    this.errorEventListener = null;
    this.global = null;
    this.dom = null;
    this.fakeTimers = null;
    return Promise.resolve();
  }

  runScript(script: Script) {
    if (this.dom) {
      // Explicitly returning `RunScriptResult` since `runVMScript` currently
      // returns `void`, which is wrong
      return (this.dom.runVMScript(script) as unknown) as RunScriptResult;
    }
    return null;
  }
}

export = JSDOMEnvironment;
