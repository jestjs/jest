/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const {readFileSync} = require('fs');
const path = require('path');
const {cleanup, run} = require('../Utils');
const runJest = require('../runJest');

const dir = path.resolve(__dirname, '../coverage-remapping');
const coverageDir = path.join(dir, 'coverage');

beforeAll(() => {
  cleanup(coverageDir);
});

it('maps code coverage against original source', () => {
  run('yarn', dir);
  const result = runJest(dir, ['--coverage', '--no-cache']);

  expect(result.status).toBe(0);

  const coverageMapFile = path.join(coverageDir, 'coverage-final.json');
  const coverageMap = JSON.parse(readFileSync(coverageMapFile, 'utf-8'));

  // reduce absolute paths embedded in the coverage map to just filenames
  Object.keys(coverageMap).forEach(filename => {
    coverageMap[filename].path = path.basename(coverageMap[filename].path);
    delete coverageMap[filename].hash;
    coverageMap[path.basename(filename)] = coverageMap[filename];
    delete coverageMap[filename];
  });
  expect(coverageMap).toMatchSnapshot();
});
