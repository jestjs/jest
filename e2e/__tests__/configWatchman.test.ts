/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('watchman config option is respected over default argv', () => {
  const {stdout} = runJest('verbose-reporter', [
    '--env=node',
    '--watchman=false',
    '--debug',
  ]);

  expect(stdout).toMatch('"watchman": false');
});

