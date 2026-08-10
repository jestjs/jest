/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

let createRuntime;

describe('Runtime', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  describe('requireModule', () => {
    it('installs source maps if available', async () => {
      expect.assertions(1);

      const runtime = await createRuntime(__filename);
      const sum = runtime.requireModule(
        runtime.__mockRootPath,
        './sourcemaps/out/throwing-mapped-fn.js',
      ).sum;

      try {
        sum();
      } catch (error) {
        if (process.platform === 'win32') {
          expect(error.stack).toMatch(
            /^Error: throwing fn\s+at sum.+\\__tests__\\test_root\\sourcemaps\\(out\\)?throwing-mapped-fn.js:\d+:\d+/,
          );
        } else {
          expect(error.stack).toMatch(
            /^Error: throwing fn\s+at sum.+\/__tests__\/test_root\/sourcemaps\/(out\/)?throwing-mapped-fn.js:\d+:\d+/,
          );
        }
      }
    });
  });
});
