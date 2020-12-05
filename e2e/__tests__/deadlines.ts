/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {skipSuiteOnJasmine} from '@jest/test-utils';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

skipSuiteOnJasmine();

it('passes generally', () => {
  const result = runJest('deadlines', ['manual-within.js']);
  expect(result.exitCode).toBe(0);
  expect(summaryWithoutTime(result)).toMatchSnapshot();
});

it('throws on deadline exceeded', () => {
  const result = runJest('deadlines', ['manual-exceeded.js']);
  expect(result.exitCode).toBe(1);
  expect(summaryWithoutTime(result)).toMatchSnapshot();
});

it('throws on deadline exceeded in a hook', () => {
  const result = runJest('deadlines', ['manual-exceeded-hook.js']);
  expect(result.exitCode).toBe(1);
  expect(summaryWithoutTime(result)).toMatchSnapshot();
});

it('throws on deadline exceeded in a describe hook', () => {
  const result = runJest('deadlines', ['manual-exceeded-hook-describe.js']);
  expect(result.exitCode).toBe(1);
  expect(summaryWithoutTime(result)).toMatchSnapshot();
});

function summaryWithoutTime(result: {stderr: string}) {
  const summary = extractSummary(result.stderr);
  summary.rest = summary.rest.replace(
    /(waited here for) \d*\.?\d+ m?s\b/,
    '$1 <<REPLACED>>',
  );
  return summary;
}
