/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {skipSuiteOnJasmine} from '@jest/test-utils';
import {wrap} from 'jest-snapshot-serializer-raw';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

skipSuiteOnJasmine();

it('defining tests and hooks asynchronously throws', () => {
  const result = runJest('circus-declaration-errors', [
    'asyncDefinition.test.js',
  ]);

  expect(result.exitCode).toBe(1);

  const {rest} = extractSummary(result.stderr);
  expect(wrap(rest)).toMatchSnapshot();
});
