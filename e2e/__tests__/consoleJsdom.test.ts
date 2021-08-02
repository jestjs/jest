/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {wrap} from 'jest-snapshot-serializer-raw';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('the jsdom console is the same as the test console', () => {
  const {stderr, stdout, exitCode} = runJest('console-jsdom');
  const {summary, rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(wrap(stdout)).toMatchSnapshot();
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
});

