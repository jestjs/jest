/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

jest.retryTimes(3);

describe('beforeAll Failure Suite', () => {
  beforeAll(async () => {
    throw new Error('whoops');
  });

  it('should not be invoked', () => {
    throw new Error('should not be invoked');
  });
});
