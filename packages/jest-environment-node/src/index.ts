/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Context,
  Script,
  compileFunction,
  createContext,
  runInContext,
} from 'vm';
import {Config, Global} from '@jest/types';
import {ModuleMocker} from 'jest-mock';
import {installCommonGlobals} from 'jest-util';
import {
  JestFakeTimers as LegacyFakeTimers,
  LolexFakeTimers,
} from '@jest/fake-timers';
import {JestEnvironment} from '@jest/environment';

type Timer = {
  id: number;
  ref: () => Timer;
  unref: () => Timer;
};

class NodeEnvironment implements JestEnvironment {
  context: Context | null;
  fakeTimers: LegacyFakeTimers<Timer> | null;
  fakeTimersLolex: LolexFakeTimers | null;
  global: Global.Global;
  moduleMocker: ModuleMocker | null;

  constructor(config: Config.ProjectConfig) {
    this.context = createContext();
    const global = (this.global = runInContext(
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
      global.URL = URL;
      global.URLSearchParams = URLSearchParams;
    }
    // TextDecoder and TextDecoder are global in Node >= 11
    if (
      typeof TextEncoder !== 'undefined' &&
      typeof TextDecoder !== 'undefined'
    ) {
      global.TextEncoder = TextEncoder;
      global.TextDecoder = TextDecoder;
      global.Uint8Array = Uint8Array;
    }
    // queueMicrotask is global in Node >= 11
    if (typeof queueMicrotask !== 'undefined') {
      global.queueMicrotask = queueMicrotask;
    }
    installCommonGlobals(global, config.globals);
    this.moduleMocker = new ModuleMocker(global);

    const timerIdToRef = (id: number) => ({
      id,
      ref() {
        return this;
      },
      unref() {
        return this;
      },
    });

    const timerRefToId = (timer: Timer): number | undefined =>
      (timer && timer.id) || undefined;

    const timerConfig = {
      idToRef: timerIdToRef,
      refToId: timerRefToId,
    };

    this.fakeTimers = new LegacyFakeTimers({
      config,
      global,
      moduleMocker: this.moduleMocker,
      timerConfig,
    });

    this.fakeTimersLolex = new LolexFakeTimers({config, global});
  }

  async setup() {}

  async teardown() {
    if (this.fakeTimers) {
      this.fakeTimers.dispose();
    }
    if (this.fakeTimersLolex) {
      this.fakeTimersLolex.dispose();
    }
    this.context = null;
    this.fakeTimers = null;
    this.fakeTimersLolex = null;
  }

  // TS infers the return type to be `any`, since that's what `runInContext`
  // returns.
  runScript(script: Script) {
    if (this.context) {
      return script.runInContext(this.context);
    }
    return null;
  }

  compileFunction(code: string, params: Array<string>, filename: string) {
    if (this.context) {
      return compileFunction(code, params, {
        filename,
        parsingContext: this.context,
      }) as any;
    }
    return null;
  }
}

// `jest-runtime` checks for `compileFunction`, so this makes sure to not expose that function if it's unsupported by this version of node
// Should be removed when we drop support for node 8
if (typeof compileFunction !== 'function') {
  delete NodeEnvironment.prototype.compileFunction;
}

export = NodeEnvironment;
