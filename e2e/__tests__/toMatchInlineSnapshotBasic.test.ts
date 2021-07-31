/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 import * as path from 'path';
 import * as fs from 'graceful-fs';
 import {wrap} from 'jest-snapshot-serializer-raw';
 import {cleanup, makeTemplate, writeFiles} from '../Utils';
 import runJest from '../runJest';
 
 const DIR = path.resolve(__dirname, '../to-match-inline-snapshot');
 const TESTS_DIR = path.resolve(DIR, '__tests__');
 
 const readFile = (filename: string) =>
   fs.readFileSync(path.join(TESTS_DIR, filename), 'utf8');
 
 beforeEach(() => cleanup(TESTS_DIR));
 afterAll(() => cleanup(TESTS_DIR));
 
 test('basic support', () => {
   const filename = 'basic-support.test.js';
   const template = makeTemplate(
     `test('inline snapshots', () => expect($1).toMatchInlineSnapshot());\n`,
   );
 
   {
     writeFiles(TESTS_DIR, {
       [filename]: template(['{apple: "original value"}']),
     });
     const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
     const fileAfter = readFile(filename);
     expect(stderr).toMatch('1 snapshot written from 1 test suite.');
     expect(exitCode).toBe(0);
     expect(wrap(fileAfter)).toMatchSnapshot('initial write');
   }
 
   {
     const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
     const fileAfter = readFile(filename);
     expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
     expect(stderr).not.toMatch('1 snapshot written from 1 test suite.');
     expect(exitCode).toBe(0);
     expect(wrap(fileAfter)).toMatchSnapshot('snapshot passed');
   }
 
   {
     writeFiles(TESTS_DIR, {
       [filename]: readFile(filename).replace('original value', 'updated value'),
     });
     const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
     const fileAfter = readFile(filename);
     expect(stderr).toMatch('Snapshot name: `inline snapshots 1`');
     expect(exitCode).toBe(1);
     expect(wrap(fileAfter)).toMatchSnapshot('snapshot mismatch');
   }
 
   {
     const {stderr, exitCode} = runJest(DIR, [
       '-w=1',
       '--ci=false',
       filename,
       '-u',
     ]);
     const fileAfter = readFile(filename);
     expect(stderr).toMatch('1 snapshot updated from 1 test suite.');
     expect(exitCode).toBe(0);
     expect(wrap(fileAfter)).toMatchSnapshot('snapshot updated');
   }
 });
 