/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 import {tmpdir} from 'os';
 import * as path from 'path';
 import {wrap} from 'jest-snapshot-serializer-raw';
 import {
   cleanup,
   createEmptyPackage,
   extractSummary,
   writeFiles,
 } from '../Utils';
 import runJest from '../runJest';
 
 const DIR = path.resolve(tmpdir(), 'globalVariables.test');
 const TEST_DIR = path.resolve(DIR, '__tests__');
 
 beforeEach(() => {
   cleanup(DIR);
   createEmptyPackage(DIR);
 });
 
 afterAll(() => cleanup(DIR));



test('skips with expand arg', () => {
  const filename = 'skipsConstructs.test.js';
  const content = `
    it('it', () => {});
    xtest('xtest', () => {});
    xit('xit', () => {});
    it.skip('it.skip', () => {});
    test.skip('test.skip', () => {});

    xdescribe('xdescribe', () => {
      it('it', () => {});
      test('test', () => {});
    });

    describe.skip('describe.skip', () => {
      test('test', () => {});
      describe('describe', () => {
        test('test', () => {});
      });
    });
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, exitCode} = runJest(DIR, ['--expand']);

  const {summary, rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(exitCode).toBe(0);
});

test('only with expand arg', () => {
  const filename = 'onlyConstructs.test.js';
  const content = `
    it('it', () => {});
    test.only('test.only', () => {});
    it.only('it.only', () => {});
    fit('fit', () => {});

    fdescribe('fdescribe', () => {
      it('it', () => {});
      test('test', () => {});
    });

    describe.only('describe.only', () => {
      test('test', () => {});
      describe('describe', () => {
        test('test', () => {});
      });
    });
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, exitCode} = runJest(DIR, ['--expand']);

  const {summary, rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(exitCode).toBe(0);
});