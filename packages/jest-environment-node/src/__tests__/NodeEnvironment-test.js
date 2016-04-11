/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

const NodeEnvironment = require.requireActual('../');

describe('NodeEnvironment', () => {

  it('uses a copy of the process object', () => {
    const env1 = new NodeEnvironment({});
    const env2 = new NodeEnvironment({});

    expect(env1.global.process).not.toBe(env2.global.process);
  });

  it('exposes process.on', () => {
    const env1 = new NodeEnvironment({});

    expect(env1.global.process.on).not.toBe(null);
  });

});
