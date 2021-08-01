/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 import * as fs from 'graceful-fs';
 import { tmpdir } from 'os';
 import * as path from 'path';
 import { json as runWithJson } from '../runJest';
 import {
  cleanup, runYarnInstall
 } from '../Utils';
 
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
 
 test('globalSetup is triggered once before all test suites', () => {
   const setupPath = path.join(e2eDir, 'setup.js');
   const result = runWithJson(e2eDir, [
     `--globalSetup=${setupPath}`,
     `--testPathPattern=__tests__`,
   ]);
 
   expect(result.exitCode).toBe(0);
   const files = fs.readdirSync(DIR);
   expect(files).toHaveLength(1);
   const setup = fs.readFileSync(path.join(DIR, files[0]), 'utf8');
   expect(setup).toBe('setup');
 });