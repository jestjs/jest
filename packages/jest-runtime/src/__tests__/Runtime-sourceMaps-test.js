/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

let createRuntime;

describe('Runtime', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  describe('requireModule', () => {
    it('installs source maps if available', () =>
      createRuntime(__filename).then(runtime => {
        let hasThrown = false;
        const sum = runtime.requireModule(
          runtime.__mockRootPath,
          './sourcemaps/out/throwing-mapped-fn.js',
        ).sum;

        try {
          sum();
        } catch (err) {
          hasThrown = true;
          /* eslint-disable max-len */
          if (process.platform === 'win32') {
            expect(err.stack).toMatch(
              /^Error: throwing fn\s+at sum.+\\__tests__\\test_root\\sourcemaps\\throwing-mapped-fn.js:10:9/,
            );
          } else {
            expect(err.stack).toMatch(
              /^Error: throwing fn\s+at sum.+\/__tests__\/test_root\/sourcemaps\/throwing-mapped-fn.js:10:9/,
            );
          }
          /* eslint-enable max-len */
        }
        expect(hasThrown).toBe(true);
      }));
  });
});
