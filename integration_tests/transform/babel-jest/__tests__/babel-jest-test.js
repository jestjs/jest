/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

require('../this-directory-is-covered/excluded-from-coverage');

it('strips flowtypes using babel-jest and .babelrc', () => {
  const a: string = 'a';
  expect(a).toBe('a');
});
