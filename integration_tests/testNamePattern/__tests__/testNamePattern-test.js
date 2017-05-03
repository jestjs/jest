/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

test('should match 1', () => expect(1).toBe(1));
test('should match 2', () => expect(1).toBe(1));
test('should not match 1', () => expect(1).toBe(1));
test.concurrent('should not match 2', () => expect(1).toBe(1));
