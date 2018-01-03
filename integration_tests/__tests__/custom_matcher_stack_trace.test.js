/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const runJest = require('../runJest');
const {extractSummary} = require('../utils');
const skipOnWindows = require('../../scripts/skip_on_windows');

skipOnWindows.suite();

test('works with custom matchers', () => {
  if (skipOnWindows.test()) {
    return;
  }

  const {stderr} = runJest('custom_matcher_stack_trace');

  expect(extractSummary(stderr).rest).toMatchSnapshot();
});
