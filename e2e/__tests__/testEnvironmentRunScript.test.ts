/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve, sep} from 'path';
import runJest from '../runJest';

it('throw error if test env does not have getVmContext', () => {
  const DIR = resolve(__dirname, '../test-environment-run-script');
  const {exitCode, stderr} = runJest(DIR);

  expect(stderr.replace(`${DIR}${sep}`, '<rootDir>/')).toMatchSnapshot();
  expect(exitCode).toBe(1);
});
