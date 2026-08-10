/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {readFileSync} from 'graceful-fs';
import {cleanup, runYarnInstall} from '../Utils';
import runJest from '../runJest';

const dir = path.resolve(__dirname, '../coverage-remapping');
const coverageDir = path.join(dir, 'coverage');

beforeAll(() => {
  cleanup(coverageDir);
});

it('maps code coverage against original source', () => {
  runYarnInstall(dir);
  const result = runJest(dir, ['--coverage', '--no-cache']);

  expect(result.exitCode).toBe(0);

  const coverageMapFile = path.join(coverageDir, 'coverage-final.json');
  const coverageMap = JSON.parse(readFileSync(coverageMapFile, 'utf8'));

  // reduce absolute paths embedded in the coverage map to just filenames
  for (const filename of Object.keys(coverageMap)) {
    coverageMap[filename].path = path.basename(coverageMap[filename].path);
    delete coverageMap[filename].hash;
    coverageMap[path.basename(filename)] = coverageMap[filename];
    delete coverageMap[filename];
  }
  expect(coverageMap).toMatchSnapshot();
});
