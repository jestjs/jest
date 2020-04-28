/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import * as fs from 'graceful-fs';
import runJest, {json as runWithJson} from '../runJest';
import {cleanup, run} from '../Utils';

const DIR = path.join(tmpdir(), 'jest-global-setup');
const project1DIR = path.join(tmpdir(), 'jest-global-setup-project-1');
const project2DIR = path.join(tmpdir(), 'jest-global-setup-project-2');
const customTransformDIR = path.join(
  tmpdir(),
  'jest-global-setup-custom-transform',
);
const nodeModulesDIR = path.join(tmpdir(), 'jest-global-setup-node-modules');
const e2eDir = path.resolve(__dirname, '../global-setup');

beforeAll(() => {
  run('yarn', e2eDir);
});

beforeEach(() => {
  cleanup(DIR);
  cleanup(project1DIR);
  cleanup(project2DIR);
  cleanup(customTransformDIR);
  cleanup(nodeModulesDIR);
});
afterAll(() => {
  cleanup(DIR);
  cleanup(project1DIR);
  cleanup(project2DIR);
  cleanup(customTransformDIR);
  cleanup(nodeModulesDIR);
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

test('jest throws an error when globalSetup does not export a function', () => {
  const setupPath = path.resolve(__dirname, '../global-setup/invalidSetup.js');
  const {exitCode, stderr} = runJest(e2eDir, [
    `--globalSetup=${setupPath}`,
    `--testPathPattern=__tests__`,
  ]);

  expect(exitCode).toBe(1);
  expect(stderr).toMatch(
    `TypeError: globalSetup file must export a function at ${setupPath}`,
  );
});

test('globalSetup function gets jest config object as a parameter', () => {
  const setupPath = path.resolve(e2eDir, 'setupWithConfig.js');

  const testPathPattern = 'pass';

  const result = runJest(e2eDir, [
    `--globalSetup=${setupPath}`,
    `--testPathPattern=${testPathPattern}`,
  ]);

  expect(result.stdout).toBe(testPathPattern);
});

test('should call globalSetup function of multiple projects', () => {
  const configPath = path.resolve(e2eDir, 'projects.jest.config.js');

  const result = runWithJson(e2eDir, [`--config=${configPath}`]);

  expect(result.exitCode).toBe(0);

  expect(fs.existsSync(DIR)).toBe(true);
  expect(fs.existsSync(project1DIR)).toBe(true);
  expect(fs.existsSync(project2DIR)).toBe(true);
});

test('should not call a globalSetup of a project if there are no tests to run from this project', () => {
  const configPath = path.resolve(e2eDir, 'projects.jest.config.js');

  const result = runWithJson(e2eDir, [
    `--config=${configPath}`,
    '--testPathPattern=project-1',
  ]);

  expect(result.exitCode).toBe(0);

  expect(fs.existsSync(DIR)).toBe(true);
  expect(fs.existsSync(project1DIR)).toBe(true);
  expect(fs.existsSync(project2DIR)).toBe(false);
});

test('should not call any globalSetup if there are no tests to run', () => {
  const configPath = path.resolve(e2eDir, 'projects.jest.config.js');

  const result = runWithJson(e2eDir, [
    `--config=${configPath}`,
    // onlyChanged ensures there are no tests to run
    '--onlyChanged',
  ]);

  expect(result.exitCode).toBe(0);

  expect(fs.existsSync(DIR)).toBe(false);
  expect(fs.existsSync(project1DIR)).toBe(false);
  expect(fs.existsSync(project2DIR)).toBe(false);
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

test('globalSetup throws with named export', () => {
  const setupPath = path.resolve(e2eDir, 'invalidSetupWithNamedExport.js');

  const {exitCode, stderr} = runJest(e2eDir, [
    `--globalSetup=${setupPath}`,
    `--testPathPattern=__tests__`,
  ]);

  expect(exitCode).toBe(1);
  expect(stderr).toMatch(
    `TypeError: globalSetup file must export a function at ${setupPath}`,
  );
});

test('should not transpile the transformer', () => {
  const {exitCode} = runJest('global-setup-custom-transform', [`--no-cache`]);

  expect(exitCode).toBe(0);
});

test('should transform node_modules if configured by transformIgnorePatterns', () => {
  const {exitCode} = runJest('global-setup-node-modules', [`--no-cache`]);

  expect(exitCode).toBe(0);
});
