/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import Env from '../jasmine/Env';
import ReportDispatcher from '../jasmine/report_dispatcher';
const options = {ReportDispatcher};
const testEnv = Env(options);
console.log(testEnv());

describe('it/test invalid argument errors', () => {
  xit(`doesn't throw errors with correct arguments`, () => {
    expect(testEnv.it('good', () => {})).toBeTruthy();
  });
  xit('throws an error when missing a callback', () => {
    expect(testEnv.it('missing callback')).toThrowError();
  });

  xit('throws an error if first argument is not a string', () => {
    expect(testEnv.it(() => {})).toThrowError();
  });

  xit('throws an error if the second argument is not a function', () => {
    expect(testEnv.it('no', 'function')).toThrowError();
  });
});
