/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 import {tmpdir} from 'os';
 import * as path from 'path';
 import * as fs from 'graceful-fs';
 import {createDirectory} from 'jest-util';
 import {cleanup, runYarnInstall} from '../Utils';
 import {json as runWithJson} from '../runJest';
 
 const DIR = path.join(tmpdir(), 'jest-global-teardown');
 const project1DIR = path.join(tmpdir(), 'jest-global-teardown-project-1');
 const project2DIR = path.join(tmpdir(), 'jest-global-teardown-project-2');
 const e2eDir = path.resolve(__dirname, '../global-teardown');
 const esmTmpDir = path.join(tmpdir(), 'jest-global-teardown-esm');
 
 beforeAll(() => {
   runYarnInstall(e2eDir);
 });
 
 beforeEach(() => {
   cleanup(DIR);
   cleanup(project1DIR);
   cleanup(project2DIR);
   cleanup(esmTmpDir);
 });
 afterAll(() => {
   cleanup(DIR);
   cleanup(project1DIR);
   cleanup(project2DIR);
   cleanup(esmTmpDir);
 });
 
 test('globalTeardown is triggered once after all test suites', () => {
   createDirectory(DIR);
   const teardownPath = path.resolve(e2eDir, 'teardown.js');
   const result = runWithJson('global-teardown', [
     `--globalTeardown=${teardownPath}`,
     `--testPathPattern=__tests__`,
   ]);
 
   expect(result.exitCode).toBe(0);
   const files = fs.readdirSync(DIR);
   expect(files).toHaveLength(1);
   const teardown = fs.readFileSync(path.join(DIR, files[0]), 'utf8');
   expect(teardown).toBe('teardown');
 });