/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {skipSuiteOnJasmine} from '@jest/test-utils';
import runJest from '../runJest';

skipSuiteOnJasmine();

it('defining tests and hooks asynchronously throws', () => {
  const result = runJest('circus-declaration-errors', [
    'asyncDefinition.test.js',
  ]);

  expect(result.status).toBe(1);
  expect(result.stderr).toMatchSnapshot();
});
