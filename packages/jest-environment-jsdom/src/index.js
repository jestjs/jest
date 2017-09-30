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
import JSDom from 'jsdom';

class JSDOMEnvironment {
  document: ?Object;
  fakeTimers: ?FakeTimers;
  global: ?Global;
  moduleMocker: ?ModuleMocker;

  constructor(config: ProjectConfig): void {
    // lazy require
    this.document = JSDom.jsdom('<!DOCTYPE html>', {
      url: config.testURL,
    });
    const global = (this.global = this.document.defaultView);
    // Node's error-message stack size is limited at 10, but it's pretty useful
    // to see more than that when a test fails.
    this.global.Error.stackTraceLimit = 100;
    installCommonGlobals(global, config.globals);

    if (!global.requestAnimationFrame) {
      global.requestAnimationFrame = callback => {
        global.setTimeout(callback, 0);
      };
    }

    this.moduleMocker = new mock.ModuleMocker(global);
    this.fakeTimers = new FakeTimers(global, this.moduleMocker, config);
  }

  dispose(): void {
    if (this.fakeTimers) {
      this.fakeTimers.dispose();
    }
    if (this.global) {
      this.global.close();
    }
    this.global = null;
    this.document = null;
    this.fakeTimers = null;
  }

  runScript(script: Script): ?any {
    if (this.global) {
      return JSDom.evalVMScript(this.global, script);
    }
    return null;
  }
}

module.exports = JSDOMEnvironment;
