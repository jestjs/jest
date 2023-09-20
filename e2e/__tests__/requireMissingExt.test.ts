/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {extractSummary, runYarnInstall} from '../Utils';
import runJest from '../runJest';

const dir = path.resolve(__dirname, '../require-missing-ext');

beforeEach(() => {
  runYarnInstall(dir);
});

test('shows a proper error from deep requires', () => {
  const {stderr} = runJest(dir);
  const {rest} = extractSummary(stderr);

  expect(rest).toMatchSnapshot();
});
