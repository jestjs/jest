/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

['default', 'summary'].forEach(reporter => {
  describe(`${reporter} reporter`, () => {
    test('prints failure messages when total number of test suites is over summaryThreshold', () => {
      const {exitCode, stderr} = runJest('summary-threshold', [
        '--config',
        JSON.stringify({
          reporters: [[reporter, {summaryThreshold: 2}]],
        }),
      ]);

      expect(exitCode).toBe(1);
      expect(stderr).toMatch(
        /Summary of all failing tests(\n|.)*expect\(1\)\.toBe\(0\)/,
      );
      expect(stderr).toMatch(
        /Summary of all failing tests(\n|.)*expect\(2\)\.toBe\(0\)/,
      );
    });
  });
});
