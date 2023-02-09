/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';

// Because we serialize/deserialize globalConfig when we spawn workers,
// we can't pass regular expression. Using this shared function on both sides
// will ensure that we produce consistent regexp for testPathPattern.
export default function testPathPatternToRegExp(
  testPathPattern: Config.GlobalConfig['testPathPattern'],
): RegExp {
  return new RegExp(testPathPattern, 'i');
}
