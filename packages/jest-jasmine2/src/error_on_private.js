/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Global} from '../../../types/Global';

// prettier-ignore
const disabledGlobals = {
  fail: 'Illegal usage of global `fail`, prefer throwing an error, or the `done.fail` callback.',
  pending: 'Illegal usage of global `pending`, prefer explicitly skipping a test using `test.skip`',
  spyOn: 'Illegal usage of global `spyOn`, prefer `jest.spyOn`.',
  spyOnProperty: 'Illegal usage of global `spyOnProperty`, prefer `jest.spyOn`.',
};

// prettier-ignore
const disabledJasmineMethods = {
  addMatchers: 'Illegal usage of `jasmine.addMatchers`, prefer `expect.extends`.',
  any: 'Illegal usage of `jasmine.any`, prefer `expect.any`.',
  anything: 'Illegal usage of `jasmine.anything`, prefer `expect.anything`.',
  arrayContaining: 'Illegal usage of `jasmine.arrayContaining`, prefer `expect.arrayContaining`.',
  createSpy: 'Illegal usage of `jasmine.createSpy`, prefer `jest.fn`.',
  objectContaining: 'Illegal usage of `jasmine.objectContaining`, prefer `expect.objectContaining`.',
  stringMatching: 'Illegal usage of `jasmine.stringMatching`, prefer `expect.stringMatching`.',
};

export function installErrorOnPrivate(global: Global): void {
  const {jasmine} = global;
  Object.keys(disabledGlobals).forEach(functionName => {
    global[functionName] = () => {
      throwAtFunction(disabledGlobals[functionName], global[functionName]);
    };
  });

  Object.keys(disabledJasmineMethods).forEach(methodName => {
    jasmine[methodName] = () => {
      throwAtFunction(disabledJasmineMethods[methodName], jasmine[methodName]);
    };
  });
}

function throwAtFunction(message, fn) {
  const e = new Error(message);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(e, fn);
  }
  throw e;
}
