/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from 'events';
import createProcessObject from '../create_process_object';

it('creates a process object that looks like the original one', () => {
  const fakeProcess = createProcessObject();

  // "process" inherits from EventEmitter through the prototype chain.
  expect(fakeProcess instanceof EventEmitter).toBe(true);

  // They look the same, but they are NOT the same (deep copied object). The
  // "_events" property is checked to ensure event emitter properties are
  // properly copied.
  ['argv', 'env', '_events'].forEach(key => {
    expect(fakeProcess[key]).toEqual(process[key]);
    expect(fakeProcess[key]).not.toBe(process[key]);
  });

  // Check that process.stdout/stderr are the same.
  expect(process.stdout).toBe(fakeProcess.stdout);
  expect(process.stderr).toBe(fakeProcess.stderr);
});

it('fakes require("process") so it is equal to "global.process"', () => {
  expect(require('process') === process).toBe(true);
});
