/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as path from 'path';
import {onNodeVersions} from '@jest/test-utils';
import runJest from '../runJest';

onNodeVersions('^12.16.0 || >=13.7.0', () => {
  test('`require.main` not undefined after createRequire', () => {
    const {stdout} = runJest('require-main-after-create-require');

    expect(stdout).toMatch(
      path.resolve(
        path.join(
          __dirname,
          '../require-main-after-create-require/__tests__/parent.test.js',
        ),
      ),
    );
  });
});
