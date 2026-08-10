/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {extractSummary, runYarnInstall} from '../Utils';
import runJest from '../runJest';

test('chai assertion errors should display properly', () => {
  const dir = path.resolve(__dirname, '../chai-assertion-library-errors');
  runYarnInstall(dir);

  const {stderr} = runJest('chai-assertion-library-errors');
  const {rest} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
});
