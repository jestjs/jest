/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import vm, {Script, Context} from 'vm';
import {Global, Config} from '@jest/types';
import {ModuleMocker} from 'jest-mock';
import {installCommonGlobals} from 'jest-util';
import {JestFakeTimers as FakeTimers} from '@jest/fake-timers';
import {JestEnvironment} from '@jest/environment';

class NodeEnvironment implements JestEnvironment {
  context: Context | null;
  fakeTimers: FakeTimers | null;
  global: Global.Global;
  moduleMocker: ModuleMocker | null;

  constructor(config: Config.ProjectConfig) {
    this.context = vm.createContext();
    const global = (this.global = vm.runInContext(
      'this',
      Object.assign(this.context, config.testEnvironmentOptions),
    ));
    global.global = global;
    global.clearInterval = clearInterval;
    global.clearTimeout = clearTimeout;
    global.setInterval = setInterval;
    global.setTimeout = setTimeout;
    global.ArrayBuffer = ArrayBuffer;
    // URL and URLSearchParams are global in Node >= 10
    if (typeof URL !== 'undefined' && typeof URLSearchParams !== 'undefined') {
      /* global URL, URLSearchParams */
      global.URL = URL;
      global.URLSearchParams = URLSearchParams;
    }
    // TextDecoder and TextDecoder are global in Node >= 11
    if (
      typeof TextEncoder !== 'undefined' &&
      typeof TextDecoder !== 'undefined'
    ) {
      /* global TextEncoder, TextDecoder */
      global.TextEncoder = TextEncoder;
      global.TextDecoder = TextDecoder;
    }
    installCommonGlobals(global, config.globals);
    this.moduleMocker = new ModuleMocker(global);

    this.fakeTimers = new FakeTimers({config, global});
  }

  setup() {
    return Promise.resolve();
  }

  teardown() {
    if (this.fakeTimers) {
      this.fakeTimers.dispose();
    }
    this.context = null;
    this.fakeTimers = null;
    return Promise.resolve();
  }

  // TS infers the return type to be `any`, since that's what `runInContext`
  // returns.
  runScript(script: Script) {
    if (this.context) {
      return script.runInContext(this.context);
    }
    return null;
  }
}

export = NodeEnvironment;
