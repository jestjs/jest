// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

jest.autoMockOff();

const NodeEnvironment = require.requireActual('../NodeEnvironment');

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
