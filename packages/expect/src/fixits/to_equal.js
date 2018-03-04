/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ExpectationFixit} from 'types/Matchers';

const areBothNumbers = (l, r) => typeof l === 'number' && typeof r === 'number';

export const fixitForToEqual = (
  expected: any,
  received: any,
): ?ExpectationFixit => {
  if (areBothNumbers(expected, received)) {
    return {
      expected: {
        value: expected,
      },
      message: `Update toEquals expectation from ${received} to ${expected}`,
      received: {
        value: received,
      },
      type: 'number',
    };
  }

  return undefined;
};
