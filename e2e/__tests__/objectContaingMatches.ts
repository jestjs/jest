/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('objectContaining matches', () => {
  const {exitCode, stderr} = runJest('object-containing-matches', [], {
    nodeOptions: '--no-warnings',
  });

  const {summary} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(summary).toMatchSnapshot();
});
