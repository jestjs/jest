/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('async error handling', () => {
  it('does not crash when asyncError is undefined and a plain object is thrown', done => {
    const {test} = require('../');

    test('inner test', (innerDone: any) => {
      // simulate async error path (where asyncError can be undefined)
      Promise.resolve().then(() => {
        throw Object.assign(new Error('Forbidden'), {status: 403});
      });

      innerDone();
    });

    done();
  });
});
