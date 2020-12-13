/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import wrap from 'jest-snapshot-serializer-raw';
import runJest from '../runJest';
import {extractSummary} from '../Utils';

const extractMessage = (str: string) =>
  wrap(
    extractSummary(str)
      .rest.replace(
        // circus-jasmine normalization
        /.+addSpecsToSuite (.+:\d+:\d+).+\n/g,
        '',
      )
      .match(
        // all lines from the first to the last mentioned "describe" after the "●" line
        /●(.|\n)*?\n(?<lines>.*describe((.|\n)*describe)*.*)(\n|$)/im,
      )?.groups?.lines ?? '',
  );

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
