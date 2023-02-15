/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('works with custom matchers', () => {
  const {stderr} = runJest('custom-matcher-stack-trace', ['sync.test.js']);

  let {rest} = extractSummary(stderr);

  rest = rest
    .split('\n')
    .filter(line => line.indexOf('at Error (native)') < 0)
    .join('\n');

  expect(rest).toMatchSnapshot();
});

test('custom async matchers', () => {
  const {stderr} = runJest('custom-matcher-stack-trace', [
    'asynchronous.test.js',
  ]);

  const {rest} = extractSummary(stderr);

  expect(rest).toMatchSnapshot();
});
