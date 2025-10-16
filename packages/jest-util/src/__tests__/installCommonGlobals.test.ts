/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createContext, runInContext} from 'vm';

declare global {
  function DTRACE_NET_SERVER_CONNECTION(): unknown;
}

const fake = jest.fn();
globalThis.DTRACE_NET_SERVER_CONNECTION = fake;

let installCommonGlobals: typeof import('../installCommonGlobals').default;

function getGlobal(): typeof globalThis {
  return runInContext('this', createContext()) as typeof globalThis;
}

beforeEach(() => {
  installCommonGlobals = (
    require('../installCommonGlobals') as typeof import('../installCommonGlobals')
  ).default;
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

it('returns the passed object', () => {
  const myGlobal = getGlobal();

  expect(installCommonGlobals(myGlobal, {})).toBe(myGlobal);
});

it('turns a V8 global object into a Node global object', () => {
  const myGlobal = installCommonGlobals(getGlobal(), {});

  expect(myGlobal.process).toBeDefined();
  expect(myGlobal.DTRACE_NET_SERVER_CONNECTION).toBeDefined();
  expect(myGlobal.DTRACE_NET_SERVER_CONNECTION).not.toBe(fake);

  myGlobal.DTRACE_NET_SERVER_CONNECTION();

  expect(fake).toHaveBeenCalledTimes(1);
});

it('overrides process.features.require_module to false when present', () => {
  const myGlobal = installCommonGlobals(getGlobal(), {});

  // Some Node versions may not expose the flag; only assert if present
  const features = (myGlobal.process as any).features;
  if (
    features &&
    Object.prototype.hasOwnProperty.call(features, 'require_module')
  ) {
    expect(features.require_module).toBe(false);
  }
});
