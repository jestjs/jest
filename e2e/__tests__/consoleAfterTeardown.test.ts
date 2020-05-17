/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {wrap} from 'jest-snapshot-serializer-raw';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('console printing', () => {
  const {stdout, stderr, exitCode} = runJest('console-after-teardown');
  const {rest} = extractSummary(stdout);

  expect(exitCode).toBe(0);
  expect(wrap(stderr)).toMatchSnapshot();
  expect(wrap(rest)).toMatchSnapshot();
});
