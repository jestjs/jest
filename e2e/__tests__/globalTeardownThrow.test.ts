/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 import {tmpdir} from 'os';
 import * as path from 'path';
 import {cleanup, runYarnInstall} from '../Utils';
 import runJest from '../runJest';
 
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
 
 test('jest throws an error when globalTeardown does not export a function', () => {
   const teardownPath = path.resolve(e2eDir, 'invalidTeardown.js');
   const {exitCode, stderr} = runJest(e2eDir, [
     `--globalTeardown=${teardownPath}`,
     `--testPathPattern=__tests__`,
   ]);
 
   expect(exitCode).toBe(1);
   expect(stderr).toContain('Jest: Got error running globalTeardown');
   expect(stderr).toContain(
     `globalTeardown file must export a function at ${teardownPath}`,
   );
 });