/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

jest.retryTimes(3, {
  retryFilter: ({errors}) =>
    errors.some(error => error.message.includes('Should retry')),
});

it('matching retry', () => {
  throw new Error('Should retry');
});

it('non-matching retry', () => {
  throw new Error('Should not retry');
});
