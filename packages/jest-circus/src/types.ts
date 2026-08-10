/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const STATE_SYM = Symbol('JEST_STATE_SYMBOL');
export const RETRY_TIMES = Symbol.for('RETRY_TIMES');
export const RETRY_IMMEDIATELY = Symbol.for('RETRY_IMMEDIATELY');
export const WAIT_BEFORE_RETRY = Symbol.for('WAIT_BEFORE_RETRY');
// To pass this value from Runtime object to state we need to use global[sym]
export const TEST_TIMEOUT_SYMBOL = Symbol.for('TEST_TIMEOUT_SYMBOL');
export const EVENT_HANDLERS = Symbol.for('EVENT_HANDLERS');
export const LOG_ERRORS_BEFORE_RETRY = Symbol.for('LOG_ERRORS_BEFORE_RETRY');
