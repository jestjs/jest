/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

require('../this-directory-is-covered/ExcludedFromCoverage');

it('strips flowtypes using babel-jest and config passed to transformer', () => {
  const a: string = 'a';
  expect(a).toBe('a');
});
