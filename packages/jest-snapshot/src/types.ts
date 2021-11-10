/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable local/ban-types-eventually */

import type {Expect} from '@jest/types';
import type * as jestMatcherUtils from 'jest-matcher-utils';
import type SnapshotStateType from './State';

export type MatchSnapshotConfig = {
  context: Expect.MatcherState;
  hint?: string;
  inlineSnapshot?: string;
  isInline: boolean;
  matcherName: string;
  properties?: object;
  received: any;
};

export type SnapshotData = Record<string, string>;

declare module '@jest/types' {
  namespace Expect {
    interface MatcherState {
      snapshotState: SnapshotStateType;

      // TODO remove utils in Jest 28, they should be imported from 'jest-matcher-utils'
      utils: typeof jestMatcherUtils & {
        iterableEquality: Tester;
        subsetEquality: Tester;
      };
    }
  }
}
