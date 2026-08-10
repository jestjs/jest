/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {json as runWithJson} from '../runJest';

test('testResultsProcessor', () => {
  const processorPath = path.resolve(
    __dirname,
    '../test-results-processor/processor.js',
  );
  const {json} = runWithJson('test-results-processor', [
    '--json',
    `--testResultsProcessor=${processorPath}`,
  ]);
  expect(json.processed).toBe(true);
});

test('testResultsProcessor async', () => {
  const processorPath = path.resolve(
    __dirname,
    '../test-results-processor/processorAsync.js',
  );
  const {json} = runWithJson('test-results-processor', [
    '--json',
    `--testResultsProcessor=${processorPath}`,
  ]);
  expect(json.processed).toBe(true);
});

test('testResultsProcessor written in ESM', () => {
  const processorPath = path.resolve(
    __dirname,
    '../test-results-processor/processor.mjs',
  );
  const {json} = runWithJson('test-results-processor', [
    '--json',
    `--testResultsProcessor=${processorPath}`,
  ]);
  expect(json.processed).toBe(true);
});
