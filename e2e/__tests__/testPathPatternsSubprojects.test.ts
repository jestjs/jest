/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {json} from '../runJest';

it('works when specifying --testPathPatterns when config is in subdir', () => {
  const {
    json: {numTotalTests},
  } = json('test-path-patterns-subprojects', [
    '--config=config/jest.config.js',
    '--testPathPatterns=testA',
  ]);
  expect(numTotalTests).toBe(1);
});
