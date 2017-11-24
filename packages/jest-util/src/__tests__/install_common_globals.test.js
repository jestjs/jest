/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

let installCommonGlobals;
let fake;

beforeEach(() => {
  fake = jest.fn();
  global.DTRACE_NET_SERVER_CONNECTION = fake;

  installCommonGlobals = require('../install_common_globals').default;
});

it('returns the passed object', () => {
  const myGlobal = {};

  expect(installCommonGlobals(myGlobal, {})).toBe(myGlobal);
});

it('turns a V8 global object into a Node global object', () => {
  const myGlobal = installCommonGlobals({}, {});

  expect(myGlobal.process).toBeDefined();
  expect(myGlobal.DTRACE_NET_SERVER_CONNECTION).toBeDefined();

  expect(myGlobal.DTRACE_NET_SERVER_CONNECTION).not.toBe(fake);
  myGlobal.DTRACE_NET_SERVER_CONNECTION();
  expect(fake.mock.calls.length).toBe(1);
});
