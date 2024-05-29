/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import * as fs from 'graceful-fs';
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

test('globalSetup is triggered once before all test suites', () => {
  const setupPath = path.join(e2eDir, 'setup.js');
  const result = runWithJson(e2eDir, [
    `--globalSetup=${setupPath}`,
    '--testPathPatterns=__tests__',
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
    '--testPathPatterns=__tests__',
  ]);

  expect(exitCode).toBe(1);
  expect(stderr).toContain('Jest: Got error running globalSetup');
  expect(stderr).toContain(
    `globalSetup file must export a function at ${setupPath}`,
  );
});

test('globalSetup function gets global config object and project config as parameters', () => {
  const setupPath = path.resolve(e2eDir, 'setupWithConfig.js');

  const result = runJest(e2eDir, [
    `--globalSetup=${setupPath}`,
    '--testPathPatterns=pass',
    '--cache=true',
  ]);

  expect(result.stdout).toBe("[ 'pass' ]\ntrue");
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
    '--testPathPatterns=setup1',
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

  const result = runJest(e2eDir, [
    `--globalSetup=${setupPath}`,
    '--testPathPatterns=pass',
    '--cache=true',
  ]);

  expect(result.stdout).toBe("[ 'pass' ]\ntrue");
});

test('globalSetup throws with named export', () => {
  const setupPath = path.resolve(e2eDir, 'invalidSetupWithNamedExport.js');

  const {exitCode, stderr} = runJest(e2eDir, [
    `--globalSetup=${setupPath}`,
    '--testPathPatterns=__tests__',
  ]);

  expect(exitCode).toBe(1);
  expect(stderr).toContain('Jest: Got error running globalSetup');
  expect(stderr).toContain(
    `globalSetup file must export a function at ${setupPath}`,
  );
});

test('should not transpile the transformer', () => {
  const {exitCode} = runJest('global-setup-custom-transform', ['--no-cache']);

  expect(exitCode).toBe(0);
});

test('should transform node_modules if configured by transformIgnorePatterns', () => {
  const {exitCode} = runJest('global-setup-node-modules', ['--no-cache']);

  expect(exitCode).toBe(0);
});

test('properly handle rejections', () => {
  createEmptyPackage(rejectionDir, {jest: {globalSetup: '<rootDir>/setup.js'}});
  writeFiles(rejectionDir, {
    'setup.js': `
      module.exports = () => Promise.reject();
    `,
    'test.js': `
      test('dummy', () => {
        expect(true).toBe(true);
      });
    `,
  });

  const {exitCode, stderr} = runJest(rejectionDir, ['--no-cache']);

  expect(exitCode).toBe(1);
  expect(stderr).toContain('Error: Jest: Got error running globalSetup');
  expect(stderr).toContain('reason: undefined');
});

test('globalSetup works with ESM modules', () => {
  const {exitCode} = runJest('global-setup-esm', ['--no-cache'], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  expect(exitCode).toBe(0);
});
