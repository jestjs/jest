/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

// The registry Jest builds while transforming cannot answer for a file it never
// transformed, so the frame has to come from the file's own inline source map.
test('maps stack frames using an inline source map on an untransformed file', () => {
  const {stderr} = runJest('source-map-not-transformed', ['--no-cache']);

  expect(stderr).toContain('at boom (lib/boom.ts:9:9)');
  expect(stderr).toContain(
    ">  9 |   throw new Error('from precompiled source');",
  );
});
