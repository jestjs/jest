/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isJestJasmineRun} from '@jest/test-utils';
import runJest from '../runJest';

it('beforeAll failures are not reported for skipped tests', () => {
  if (isJestJasmineRun()) return;
  const {stderr} = runJest('before-all-failing');
  const failures = [...stderr.matchAll(/● .+?$/gm)].map(m => m[0].slice(2));
  expect(failures).toEqual(['foo', 'nested › foo']);
});
