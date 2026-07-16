/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('does not crash when expect involving a DOM node fails', () => {
  const result = runJest('compare-dom-nodes');

  expect(result.stderr).toContain('FAIL __tests__/failedAssertion.js');
});
