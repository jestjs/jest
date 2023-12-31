/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

const extractMessage = (str: string) =>
  extractSummary(str)
    .rest.replaceAll(
      // circus-jasmine normalization
      /.+addSpecsToSuite (.+:\d+:\d+).+\n/g,
      '',
    )
    .match(
      // all lines from the first to the last mentioned "describe" after the "●" line
      /●(.|\n)*?\n(?<lines>.*describe((.|\n)*describe)*.*)(\n|$)/imu,
    )?.groups?.lines ?? '';

it('errors if describe returns a Promise', () => {
  const result = runJest('declaration-errors', [
    'describeReturnPromise.test.js',
  ]);

  expect(result.exitCode).toBe(1);
  expect(extractMessage(result.stderr)).toMatchSnapshot();
});

it('errors if describe returns something', () => {
  const result = runJest('declaration-errors', [
    'describeReturnSomething.test.js',
  ]);

  expect(result.exitCode).toBe(1);
  expect(extractMessage(result.stderr)).toMatchSnapshot();
});

it('errors if describe throws', () => {
  const result = runJest('declaration-errors', ['describeThrow.test.js']);

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain('whoops');
});
