/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {
  cleanup,
  createEmptyPackage,
  extractSortedSummary,
  writeFiles,
} from '../Utils';
import {runContinuous} from '../runJest';

const tempDir = path.resolve(tmpdir(), 'bigint-inequality-test');

const testIn2Workers = async (testFileContent: string) => {
  writeFiles(tempDir, {
    '__tests__/test-1.js': testFileContent,
    '__tests__/test-2.js': testFileContent,
  });

  const {end, waitUntil} = runContinuous(
    tempDir,
    ['--no-watchman', '--watch-all'],
    // timeout in case the `waitUntil` below doesn't fire
    {stripAnsi: true, timeout: 5000},
  );

  await waitUntil(({stderr}) => stderr.includes('Ran all test suites.'));

  const {stderr} = await end();

  return extractSortedSummary(stderr);
};

beforeEach(() => {
  createEmptyPackage(tempDir);
});

afterEach(() => {
  cleanup(tempDir);
});

test('handles `Map`', async () => {
  const {summary, rest} = await testIn2Workers(`
    it('test', () => {
      expect(new Map([[1, "2"]])).toEqual(new Map([[1, "3"]]));
    });
  `);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('handles `BigInt`', async () => {
  const {summary, rest} = await testIn2Workers(`
    it('test', () => {
      expect(BigInt(42)).toBe(BigInt(73));
    });
  `);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('handles `Symbol`', async () => {
  const {summary, rest} = await testIn2Workers(`
    it('test', () => {
      expect(Symbol('a')).toEqual(Symbol('b'));
    });
  `);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('handles functions', async () => {
  const {summary, rest} = await testIn2Workers(`
    it('test', () => {
      const fn1 = () => {};
      const fn2 = () => {};
      expect(fn1).toEqual(fn2);
    });
  `);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('handles mixed structure', async () => {
  const {summary, rest} = await testIn2Workers(`
    it('test', () => {
      class Class {
        constructor() {
          this.ref = this;
          this.bigInt = BigInt(42);
          this.map = new Map([[1, "2"]]);
          this.symbol = Symbol('asd');
          this[Symbol('qwe')] = Symbol('zxc');
          this.fn = () => {};
        }
        method() {}
      }
      expect(new Class()).toEqual(false);
    });
  `);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});
