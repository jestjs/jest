/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */
'use strict';

const runJest = require('../runJest');

test('testNamePattern', () => {
  const path = require('path');
  const processorPath = path.resolve(
    __dirname,
    '../testResultsProcessor/processor.js',
  );
  const result = runJest.json('testResultsProcessor', [
    '--json',
    `--testResultsProcessor=${processorPath}`,
  ]);
  const json = result.json;
  expect(json.processed).toBe(true);
});
