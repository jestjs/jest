/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('works with custom inline snapshot matchers', () => {
  const {stderr} = runJest('custom-inline-snapshot-matchers', [
    // Prevent adding new snapshots or rather changing the test.
    '--ci',
    'asynchronous.test.js',
  ]);

  let {rest} = extractSummary(stderr);

  rest = rest
    .split('\n')
    .filter(line => line.indexOf('at Error (native)') < 0)
    .join('\n');

  expect(rest).toMatchSnapshot();
});

test('can bail with a custom inline snapshot matcher', () => {
  const {stderr} = runJest('custom-inline-snapshot-matchers', [
    // Prevent adding new snapshots or rather changing the test.
    '--ci',
    'bail.test.js',
  ]);

  let {rest} = extractSummary(stderr);

  rest = rest
    .split('\n')
    .filter(line => line.indexOf('at Error (native)') < 0)
    .join('\n');

  expect(rest).toMatchSnapshot();
});
