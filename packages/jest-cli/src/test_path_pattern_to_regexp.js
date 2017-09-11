/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

// Because we serialize/deserialize globalConfig when we spawn workers,
// we can't pass regular expression. Using this shared function on both sides
// will ensure that we produce consistent regexp for testPathPattern.
export default (testPathPattern: string) => new RegExp(testPathPattern, 'i');
