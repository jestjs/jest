/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 import {tmpdir} from 'os';
 import * as path from 'path';
 import * as fs from 'graceful-fs';
 import {onNodeVersions} from '@jest/test-utils';
 import {
   cleanup,
   createEmptyPackage,
   runYarnInstall,
   writeFiles,
 } from '../Utils';
 import runJest, {json as runWithJson} from '../runJest';
 
 const DIR = path.join(tmpdir(), 'jest-global-setup');
 const project1DIR = path.join(tmpdir(), 'jest-global-setup-project-1');
 const project2DIR = path.join(tmpdir(), 'jest-global-setup-project-2');
 const customTransformDIR = path.join(
   tmpdir(),
   'jest-global-setup-custom-transform',
 );
 const nodeModulesDIR = path.join(tmpdir(), 'jest-global-setup-node-modules');
 const rejectionDir = path.join(tmpdir(), 'jest-global-setup-rejection');
 const e2eDir = path.resolve(__dirname, '../global-setup');
 const esmTmpDir = path.join(tmpdir(), 'jest-global-setup-esm');
 
 beforeAll(() => {
   runYarnInstall(e2eDir);
 });
 
 beforeEach(() => {
   cleanup(DIR);
   cleanup(project1DIR);
   cleanup(project2DIR);
   cleanup(customTransformDIR);
   cleanup(nodeModulesDIR);
   cleanup(rejectionDir);
   cleanup(esmTmpDir);
 });
 
 afterAll(() => {
   cleanup(DIR);
   cleanup(project1DIR);
   cleanup(project2DIR);
   cleanup(customTransformDIR);
   cleanup(nodeModulesDIR);
   cleanup(rejectionDir);
   cleanup(esmTmpDir);
 });

test('globalSetup works with default export', () => {
  const setupPath = path.resolve(e2eDir, 'setupWithDefaultExport.js');

  const testPathPattern = 'pass';

  const result = runJest(e2eDir, [
    `--globalSetup=${setupPath}`,
    `--testPathPattern=${testPathPattern}`,
  ]);

  expect(result.stdout).toBe(testPathPattern);
});