/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('error when internal matcher inside a custom matcher fails', () => {
  const {exitCode, stderr} = runJest('internal-matcher-exposure');
  const {rest} = extractSummary(stderr);

  expect(rest).toMatchSnapshot();
  expect(exitCode).toBe(1);
});
