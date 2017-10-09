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
const skipOnWindows = require('../../scripts/skip_on_windows');
const {run} = require('../utils');
const runJest = require('../runJest');

skipOnWindows.suite();

it('maps code coverage against original source', () => {
  const dir = path.resolve(__dirname, '../coverage-remapping');
  run('yarn', dir);
  runJest(dir, ['--coverage', '--mapCoverage', '--no-cache']);

  const coverageMapFile = path.join(
    __dirname,
    '../coverage-remapping/coverage/coverage-final.json',
  );
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
