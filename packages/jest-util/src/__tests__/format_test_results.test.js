/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import formatTestResults from '../format_test_results';

describe('formatTestResults', () => {
  const assertion = {
    fullName: 'TestedModule#aMethod when some condition is met returns true',
    status: 'passed',
    title: 'returns true',
  };

  const results = {
    testResults: [
      {
        numFailingTests: 0,
        perfStats: {end: 2, start: 1},
        testResults: [assertion],
      },
    ],
  };

  it('includes test full name', () => {
    const result = formatTestResults(results, null, null);
    expect(result.testResults[0].assertionResults[0].fullName).toEqual(
      assertion.fullName,
    );
  });
});
