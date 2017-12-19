/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

describe('matchers', () => {
  it('proxies matchers to expect', () => {
    expect(() => expect(1).toBe(2)).toThrowErrorMatchingSnapshot();
  });
});
