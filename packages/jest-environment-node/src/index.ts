/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Context, createContext, runInContext} from 'vm';
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

export default class NodeEnvironment implements JestEnvironment<Timer> {
  context: Context | null;
  fakeTimers: LegacyFakeTimers<Timer> | null;
  fakeTimersModern: ModernFakeTimers | null;
  global: Global.Global;
  moduleMocker: ModuleMocker | null;

  // while `context` is unused, it should always be passed
  constructor(config: JestEnvironmentConfig, _context: EnvironmentContext) {
    const {projectConfig} = config;
    this.context = createContext();
    const global = (this.global = runInContext(
      'this',
      Object.assign(this.context, projectConfig.testEnvironmentOptions),
    ));
    global.global = global;
    global.clearInterval = clearInterval;
    global.clearTimeout = clearTimeout;
    global.setInterval = setInterval;
    global.setTimeout = setTimeout;
    global.Buffer = Buffer;
    global.setImmediate = setImmediate;
    global.clearImmediate = clearImmediate;
    global.ArrayBuffer = ArrayBuffer;
    // TextEncoder (global or via 'util') references a Uint8Array constructor
    // different than the global one used by users in tests. This makes sure the
    // same constructor is referenced by both.
    global.Uint8Array = Uint8Array;

    // URL and URLSearchParams are global in Node >= 10
    global.URL = URL;
    global.URLSearchParams = URLSearchParams;

    // TextDecoder and TextDecoder are global in Node >= 11
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;

    // queueMicrotask is global in Node >= 11
    global.queueMicrotask = queueMicrotask;

    // AbortController is global in Node >= 15
    if (typeof AbortController !== 'undefined') {
      global.AbortController = AbortController;
    }
    // AbortSignal is global in Node >= 15
    if (typeof AbortSignal !== 'undefined') {
      global.AbortSignal = AbortSignal;
    }
    // Event is global in Node >= 15.4
    if (typeof Event !== 'undefined') {
      global.Event = Event;
    }
    // EventTarget is global in Node >= 15.4
    if (typeof EventTarget !== 'undefined') {
      global.EventTarget = EventTarget;
    }
    // MessageChannel is global in Node >= 15
    if (typeof MessageChannel !== 'undefined') {
      global.MessageChannel = MessageChannel;
    }
    // MessageEvent is global in Node >= 15
    if (typeof MessageEvent !== 'undefined') {
      global.MessageEvent = MessageEvent;
    }
    // performance is global in Node >= 16
    if (typeof performance !== 'undefined') {
      global.performance = performance;
    }
    // atob and btoa are global in Node >= 16
    if (typeof atob !== 'undefined' && typeof btoa !== 'undefined') {
      global.atob = atob;
      global.btoa = btoa;
    }
    // structuredClone is global in Node >= 17
    // @ts-expect-error type definition for structuredClone is missing
    if (typeof structuredClone !== 'undefined') {
      // @ts-expect-error type definition for structuredClone is missing
      global.structuredClone = structuredClone;
    }
    installCommonGlobals(global, projectConfig.globals);

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
      config: projectConfig,
      global,
      moduleMocker: this.moduleMocker,
      timerConfig,
    });

    this.fakeTimersModern = new ModernFakeTimers({
      config: projectConfig,
      global,
    });
  }

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
    return ['node', 'node-addons'];
  }

  getVmContext(): Context | null {
    return this.context;
  }
}

export const TestEnvironment = NodeEnvironment;
