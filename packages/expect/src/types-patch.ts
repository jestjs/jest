/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {EqualsFunction, Tester} from '@jest/expect-utils';
import type * as jestMatcherUtils from 'jest-matcher-utils';

declare module '@jest/types' {
  namespace Expect {
    interface MatcherState {
      // TODO consider removing all utils from MatcherState
      equals: EqualsFunction;
      utils: typeof jestMatcherUtils & {
        iterableEquality: Tester;
        subsetEquality: Tester;
      };
    }
  }
}
