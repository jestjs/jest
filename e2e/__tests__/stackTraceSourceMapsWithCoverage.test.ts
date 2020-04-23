/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as path from 'path';
import {extractSummary, run} from '../Utils';
import runJest from '../runJest';

it('processes stack traces and code frames with source maps with coverage', () => {
  const dir = path.resolve(
    __dirname,
    '../stack-trace-source-maps-with-coverage',
  );
  run('yarn', dir);
  const {stderr} = runJest(dir, ['--no-cache', '--coverage']);
  expect(extractSummary(stderr)).toMatchSnapshot();
});
