/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const path = require('path');
const {
  run,
  cleanup,
  createEmptyPackage,
  linkJestPackage,
  copyDir,
} = require('../Utils');
const runJest = require('../runJest');
const os = require('os');

describe('babel-jest', () => {
  const dir = path.resolve(__dirname, '..', 'transform/babel-jest');

  beforeEach(() => {
    run('yarn', dir);
  });

  it('runs transpiled code', () => {
    // --no-cache because babel can cache stuff and result in false green
    const {json} = runJest.json(dir, ['--no-cache']);
    expect(json.success).toBe(true);
    expect(json.numTotalTests).toBeGreaterThanOrEqual(1);
  });

  it('instruments only specific files and collects coverage', () => {
    const {stdout} = runJest(dir, ['--coverage', '--no-cache']);
    expect(stdout).toMatch('Covered.js');
    expect(stdout).not.toMatch('NotCovered.js');
    expect(stdout).not.toMatch('ExcludedFromCoverage.js');
    // coverage result should not change
    expect(stdout).toMatchSnapshot();
  });
});

// babel-jest is automatically linked at the root because it is a workspace now
// a way to test this in isolation is to move the test suite into a temp folder
describe('no babel-jest', () => {
  const dir = path.resolve(__dirname, '..', 'transform/no-babel-jest');
  // doing test in a temp directory because we don't want jest node_modules affect it
  const tempDir = path.resolve(os.tmpdir(), 'transform-no-babel-jest');

  beforeEach(() => {
    cleanup(tempDir);
    createEmptyPackage(tempDir);
    copyDir(dir, tempDir);
    linkJestPackage('babel-jest', tempDir);
  });

  test('fails with syntax error on flow types', () => {
    const {stderr} = runJest(tempDir, ['--no-cache', '--no-watchman']);
    expect(stderr).toMatch(/FAIL.*fails_with_syntax_error/);
    expect(stderr).toMatch('Unexpected token');
  });

  test('instrumentation with no babel-jest', () => {
    const {stdout} = runJest(tempDir, [
      '--no-cache',
      '--coverage',
      '--no-watchman',
    ]);
    expect(stdout).toMatch('Covered.js');
    expect(stdout).not.toMatch('ExcludedFromCoverage.js');
    // coverage result should not change
    expect(stdout).toMatchSnapshot();
  });
});

describe('custom transformer', () => {
  const dir = path.resolve(
    __dirname,
    '..',
    'transform/custom-instrumenting-preprocessor',
  );

  it('proprocesses files', () => {
    const {json, stderr} = runJest.json(dir, ['--no-cache']);
    expect(stderr).toMatch(/FAIL/);
    expect(stderr).toMatch(/instruments by setting.*global\.__INSTRUMENTED__/);
    expect(json.numTotalTests).toBe(2);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(1);
  });

  it('instruments files', () => {
    const {stdout, status} = runJest(dir, ['--no-cache', '--coverage']);
    // coverage should be empty because there's no real instrumentation
    expect(stdout).toMatchSnapshot();
    expect(status).toBe(0);
  });
});

describe('multiple-transformers', () => {
  const dir = path.resolve(__dirname, '..', 'transform/multiple-transformers');

  beforeEach(() => {
    run('yarn', dir);
  });

  it('transforms dependencies using specific transformers', () => {
    const {json, stderr} = runJest.json(dir, ['--no-cache']);

    expect(stderr).toMatch(/PASS/);
    expect(json.numTotalTests).toBe(1);
    expect(json.numPassedTests).toBe(1);
  });
});

describe('ecmascript-modules-support', () => {
  const dir = path.resolve(
    __dirname,
    '..',
    'transform/ecmascript-modules-support',
  );

  it('runs transpiled code', () => {
    // --no-cache because babel can cache stuff and result in false green
    const {json} = runJest.json(dir, ['--no-cache']);
    expect(json.success).toBe(true);
    expect(json.numTotalTests).toBeGreaterThanOrEqual(1);
  });
});
