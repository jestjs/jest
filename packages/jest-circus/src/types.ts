/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus} from '@jest/types';
import type {Expect} from 'expect';

export const STATE_SYM = Symbol('JEST_STATE_SYMBOL');
export const RETRY_TIMES = Symbol.for('RETRY_TIMES');
// To pass this value from Runtime object to state we need to use global[sym]
export const TEST_TIMEOUT_SYMBOL = Symbol.for('TEST_TIMEOUT_SYMBOL');
export const LOG_ERRORS_BEFORE_RETRY = Symbol.for(
  'LOG_ERRORS_BEFORE_RETRY',
);

declare global {
  namespace NodeJS {
    interface Global {
      [STATE_SYM]: Circus.State;
      [RETRY_TIMES]: string;
      [TEST_TIMEOUT_SYMBOL]: number;
      [LOG_ERRORS_BEFORE_RETRY]: boolean;
      expect: Expect;
    }
  }
}
