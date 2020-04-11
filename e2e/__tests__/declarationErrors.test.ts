/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import wrap from 'jest-snapshot-serializer-raw';
import runJest from '../runJest';

const normalizeCircusJasmine = (str: string) =>
  wrap(
    str
      .replace(/console\.log .+:\d+/, 'console.log')
      .replace(/.+addSpecsToSuite (.+:\d+:\d+).+\n/g, '')
      .replace(/.+_dispatchDescribe (.+:\d+:\d+).+\n/g, ''),
  );

it('warns if describe returns a Promise', () => {
  const result = runJest('declaration-errors', [
    'describeReturnPromise.test.js',
  ]);

  expect(result.exitCode).toBe(0);
  expect(normalizeCircusJasmine(result.stdout)).toMatchSnapshot();
});

it('warns if describe returns something', () => {
  const result = runJest('declaration-errors', [
    'describeReturnSomething.test.js',
  ]);

  expect(result.exitCode).toBe(0);
  expect(normalizeCircusJasmine(result.stdout)).toMatchSnapshot();
});

it('errors if describe throws', () => {
  const result = runJest('declaration-errors', ['describeThrow.test.js']);

  expect(result.exitCode).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr).toContain('whoops');
});
