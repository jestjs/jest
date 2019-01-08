/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import path from 'path';
import runJest from '../runJest';
import {extractSummary} from '../Utils';
import {skipSuiteOnJasmine} from '../../scripts/ConditionalTest';

const dir = path.resolve(__dirname, '../empty-describe-with-hooks');

skipSuiteOnJasmine();

test('hook in empty describe', () => {
  const result = runJest(dir, ['hook-in-empty-describe.test.js']);
  expect(result.status).toBe(1);
  expect(extractSummary(result.stderr)).toMatchSnapshot();
});

test('hook in describe with skipped test', () => {
  const result = runJest(dir, ['hook-in-describe-with-skipped-test.test.js']);
  expect(result.status).toBe(0);
  expect(extractSummary(result.stderr)).toMatchSnapshot();
});

test('hook in empty nested describe', () => {
  const result = runJest(dir, ['hook-in-empty-nested-describe.test.js']);
  expect(result.status).toBe(1);
  expect(extractSummary(result.stderr)).toMatchSnapshot();
});

test('multiple hooks in empty describe', () => {
  const result = runJest(dir, ['multiple-hooks-in-empty-describe.test.js']);
  expect(result.status).toBe(1);
  expect(extractSummary(result.stderr)).toMatchSnapshot();
});
