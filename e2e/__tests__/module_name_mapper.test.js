/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

import runJest from '../runJest';
import {extractSummary} from '../Utils';

test('moduleNameMapper wrong configuration', () => {
  const {stderr, status} = runJest('module-name-mapper-wrong-config');
  const {rest} = extractSummary(stderr);

  expect(status).toBe(1);
  expect(rest).toMatchSnapshot();
});

test('moduleNameMapper correct configuration', () => {
  const {stderr, status} = runJest('module-name-mapper-correct-config', [], {
    stripAnsi: true,
  });
  const {rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(rest).toMatchSnapshot();
});
