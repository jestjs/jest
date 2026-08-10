/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {runYarnInstall} from '../Utils';
import runJest from '../runJest';

it('instruments and collects coverage for typescript files', () => {
  const dir = path.resolve(__dirname, '../typescript-coverage');
  runYarnInstall(dir);
  const {stdout} = runJest(dir, ['--coverage', '--no-cache'], {
    stripAnsi: true,
  });
  expect(stdout).toMatchSnapshot();
});
