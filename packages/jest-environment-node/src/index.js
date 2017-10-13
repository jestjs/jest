/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Script} from 'vm';
import type {ProjectConfig} from 'types/Config';
import type {Global} from 'types/Global';
import type {ModuleMocker} from 'jest-mock';

import vm from 'vm';
import {FakeTimers, installCommonGlobals} from 'jest-util';
import mock from 'jest-mock';

type Timer = {|
  id: number,
  ref: () => Timer,
  unref: () => Timer,
|};

class NodeEnvironment {
  context: ?vm$Context;
  fakeTimers: ?FakeTimers<Timer>;
  global: ?Global;
  moduleMocker: ?ModuleMocker;

  constructor(config: ProjectConfig) {
    this.context = vm.createContext();
    const global = (this.global = vm.runInContext('this', this.context));
    global.global = global;
    global.clearInterval = clearInterval;
    global.clearTimeout = clearTimeout;
    global.Promise = Promise;
    global.setInterval = setInterval;
    global.setTimeout = setTimeout;
    installCommonGlobals(global, config.globals);
    this.moduleMocker = new mock.ModuleMocker(global);

    const timerIdToRef = (id: number) => ({
      id,
      ref() {
        return this;
      },
      unref() {
        return this;
      },
    });

    const timerRefToId = (timer: Timer) => timer.id;

    const timerConfig = {
      idToRef: timerIdToRef,
      refToId: timerRefToId,
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
    this.context = null;
    this.fakeTimers = null;
    return Promise.resolve();
  }

  // Disabling rule as return type depends on script's return type.
  /* eslint-disable flowtype/no-weak-types */
  runScript(script: Script): ?any {
    /* eslint-enable flowtype/no-weak-types */
    if (this.context) {
      return script.runInContext(this.context);
    }
    return null;
  }
}

module.exports = NodeEnvironment;
