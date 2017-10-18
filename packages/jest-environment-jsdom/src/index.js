/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {Script} from 'vm';
import type {ProjectConfig} from 'types/Config';
import type {Global} from 'types/Global';
import type {ModuleMocker} from 'jest-mock';

import {FakeTimers, installCommonGlobals} from 'jest-util';
import mock from 'jest-mock';
import jsdom from 'jsdom';

class JSDOMEnvironment {
  dom: ?Object;
  fakeTimers: ?FakeTimers<number>;
  global: ?Global;
  errorEventListener: ?Function;
  moduleMocker: ?ModuleMocker;

  constructor(config: ProjectConfig): void {
    const jsdomInitialized = process.hrtime();
    // lazy require
    this.dom = new jsdom.JSDOM(`<!DOCTYPE html>`, {
      runScripts: 'dangerously',
      url: config.testURL,
    });
    const global = (this.global = this.dom.window);
    // Node's error-message stack size is limited at 10, but it's pretty useful
    // to see more than that when a test fails.
    this.global.Error.stackTraceLimit = 100;
    installCommonGlobals(global, config.globals);

    if (!global.requestAnimationFrame) {
      global.requestAnimationFrame = callback => {
        const hr = process.hrtime(jsdomInitialized);
        const hrInNano = hr[0] * 1e9 + hr[1];
        const hrInMicro = hrInNano / 1e6;

        return global.setTimeout(callback, 0, hrInMicro);
      };
    }

    this.errorEventListener = event => {
      if (event.error) {
        process.emit('uncaughtException', event.error);
      }
    };
    global.addEventListener('error', this.errorEventListener);

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

  setup(): Promise<void> {
    return Promise.resolve();
  }

  teardown(): Promise<void> {
    if (this.fakeTimers) {
      this.fakeTimers.dispose();
    }
    if (this.global) {
      if (this.errorEventListener) {
        this.global.removeEventListener('error', this.errorEventListener);
      }
      this.global.close();
    }
    this.errorEventListener = null;
    this.global = null;
    this.dom = null;
    this.fakeTimers = null;
    return Promise.resolve();
  }

  runScript(script: Script): ?any {
    if (this.dom) {
      return this.dom.runVMScript(script);
    }
    return null;
  }
}

module.exports = JSDOMEnvironment;
