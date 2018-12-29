/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

import {extractSummary} from '../Utils';
import {json as runWithJson} from '../runJest';

test('testNamePattern skipped', () => {
  const {stderr, status} = runWithJson('testNamePattern_skipped', [
    '--testNamePattern',
    'false',
  ]);
  const {summary} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(summary).toMatchSnapshot();
});
