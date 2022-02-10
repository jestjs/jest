/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Jest} from '@jest/environment';
import type {EqualsFunction, Tester} from '@jest/expect-utils';
import type {Global} from '@jest/types';
import type * as jestMatcherUtils from 'jest-matcher-utils';

export declare const jest: Jest;

export declare const it: Global.GlobalAdditions['it'];
export declare const fit: Global.GlobalAdditions['fit'];
export declare const xit: Global.GlobalAdditions['xit'];

export declare const test: Global.GlobalAdditions['test'];
export declare const xtest: Global.GlobalAdditions['xtest'];

export declare const describe: Global.GlobalAdditions['describe'];
export declare const fdescribe: Global.GlobalAdditions['fdescribe'];
export declare const xdescribe: Global.GlobalAdditions['xdescribe'];

export declare const beforeAll: Global.GlobalAdditions['beforeAll'];
export declare const beforeEach: Global.GlobalAdditions['beforeEach'];
export declare const afterEach: Global.GlobalAdditions['afterEach'];
export declare const afterAll: Global.GlobalAdditions['afterAll'];

export declare const expect: Global.GlobalAdditions['expect'];

throw new Error(
  'Do not import `@jest/globals` outside of the Jest test environment',
);

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
