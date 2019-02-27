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
import {JestEnvironment, EnvironmentContext} from '@jest/environment';
import {JSDOM, VirtualConsole} from 'jsdom';

class JSDOMEnvironment implements JestEnvironment {
  dom: JSDOM | null;
  fakeTimers: FakeTimers<number> | null;
  global: Global.Global;
  errorEventListener: ((event: Event & {error: any}) => void) | null;
  moduleMocker: ModuleMocker | null;

  constructor(config: Config.ProjectConfig, options: EnvironmentContext = {}) {
    this.dom = new JSDOM('<!DOCTYPE html>', {
      pretendToBeVisual: true,
      runScripts: 'dangerously',
      url: config.testURL,
      virtualConsole: new VirtualConsole().sendTo(options.console || console),
      ...config.testEnvironmentOptions,
    });
    const global = (this.global = this.dom.window.document.defaultView);
    // Node's error-message stack size is limited at 10, but it's pretty useful
    // to see more than that when a test fails.
    this.global.Error.stackTraceLimit = 100;
    installCommonGlobals(global, config.globals);

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
    global.addEventListener = function(name: string) {
      if (name === 'error') {
        userErrorListenerCount++;
      }
      return originalAddListener.apply(this, arguments);
    };
    global.removeEventListener = function(name: string) {
      if (name === 'error') {
        userErrorListenerCount--;
      }
      return originalRemoveListener.apply(this, arguments);
    };

    this.moduleMocker = new mock.ModuleMocker(global);

    const timerConfig = {
      idToRef: (id: number) => id,
      refToId: (ref: number) => ref,
    };

    this.fakeTimers = new FakeTimers({
      config,
      global,
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
      if (this.errorEventListener) {
        this.global.removeEventListener('error', this.errorEventListener);
      }
      // Dispose "document" to prevent "load" event from triggering.
      Object.defineProperty(this.global, 'document', {value: null});
      this.global.close();
    }
    this.errorEventListener = null;
    this.global = null;
    this.dom = null;
    this.fakeTimers = null;
    return Promise.resolve();
  }

  runScript(script: Script) {
    if (this.dom) {
      // `runVMScript` returns `void` and JestEnvironment.runScript is expected
      // to return `... | null` so we don't return (`void`) early here:
      //
      // return this.dom.runVMScript(script);
      this.dom.runVMScript(script);
    }
    return null;
  }
}

export = JSDOMEnvironment;
