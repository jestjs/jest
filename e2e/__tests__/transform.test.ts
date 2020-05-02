/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {tmpdir} from 'os';
import {wrap} from 'jest-snapshot-serializer-raw';
import {
  cleanup,
  copyDir,
  createEmptyPackage,
  extractSummary,
  linkJestPackage,
  run,
} from '../Utils';
import runJest, {json as runWithJson} from '../runJest';

describe('babel-jest', () => {
  const dir = path.resolve(__dirname, '..', 'transform/babel-jest');

  beforeEach(() => {
    run('yarn', dir);
  });

  it('runs transpiled code', () => {
    // --no-cache because babel can cache stuff and result in false green
    const {json} = runWithJson(dir, ['--no-cache']);
    expect(json.success).toBe(true);
    expect(json.numTotalTests).toBeGreaterThanOrEqual(2);
  });

  it('instruments only specific files and collects coverage', () => {
    const {stdout} = runJest(dir, ['--coverage', '--no-cache'], {
      stripAnsi: true,
    });
    expect(stdout).toMatch('covered.js');
    expect(stdout).not.toMatch('notCovered.js');
    expect(stdout).not.toMatch('excludedFromCoverage.js');
    // coverage result should not change
    expect(wrap(stdout)).toMatchSnapshot();
  });
});

describe('babel-jest ignored', () => {
  const dir = path.resolve(__dirname, '..', 'transform/babel-jest-ignored');

  it('tells user to match ignored files', () => {
    // --no-cache because babel can cache stuff and result in false green
    const {exitCode, stderr} = runJest(dir, ['--no-cache']);
    expect(exitCode).toBe(1);
    expect(wrap(extractSummary(stderr).rest)).toMatchSnapshot();
  });
});

describe('babel-jest with manual transformer', () => {
  const dir = path.resolve(__dirname, '..', 'transform/babel-jest-manual');

  beforeEach(() => {
    run('yarn', dir);
  });

  it('runs transpiled code', () => {
    // --no-cache because babel can cache stuff and result in false green
    const {json} = runWithJson(dir, ['--no-cache']);
    expect(json.success).toBe(true);
    expect(json.numTotalTests).toBeGreaterThanOrEqual(1);
  });
});

// babel-jest is automatically linked at the root because it is a workspace now
// a way to test this in isolation is to move the test suite into a temp folder
describe('no babel-jest', () => {
  const dir = path.resolve(__dirname, '..', 'transform/no-babel-jest');
  // doing test in a temp directory because we don't want jest node_modules affect it
  const tempDir = path.resolve(tmpdir(), 'transform-no-babel-jest');

  beforeEach(() => {
    cleanup(tempDir);
    createEmptyPackage(tempDir);
    copyDir(dir, tempDir);
    linkJestPackage('babel-jest', tempDir);
  });

  test('fails with syntax error on flow types', () => {
    const {stderr} = runJest(tempDir, ['--no-cache', '--no-watchman']);
    expect(stderr).toMatch(/FAIL.*failsWithSyntaxError/);
    expect(stderr).toMatch('Unexpected token');
  });

  test('instrumentation with no babel-jest', () => {
    const {stdout} = runJest(
      tempDir,
      ['--no-cache', '--coverage', '--no-watchman'],
      {stripAnsi: true},
    );
    expect(stdout).toMatch('covered.js');
    expect(stdout).not.toMatch('excludedFromCoverage.js');
    // coverage result should not change
    expect(wrap(stdout)).toMatchSnapshot();
  });
});

describe('custom transformer', () => {
  const dir = path.resolve(
    __dirname,
    '..',
    'transform/custom-instrumenting-preprocessor',
  );

  it('proprocesses files', () => {
    const {json, stderr} = runWithJson(dir, ['--no-cache']);
    expect(stderr).toMatch(/FAIL/);
    expect(stderr).toMatch(/instruments by setting.*global\.__INSTRUMENTED__/);
    expect(json.numTotalTests).toBe(2);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(1);
  });

  it('instruments files', () => {
    const {stdout, exitCode} = runJest(dir, ['--no-cache', '--coverage'], {
      stripAnsi: true,
    });
    // coverage should be empty because there's no real instrumentation
    expect(wrap(stdout)).toMatchSnapshot();
    expect(exitCode).toBe(0);
  });
});

describe('multiple-transformers', () => {
  const dir = path.resolve(__dirname, '..', 'transform/multiple-transformers');

  beforeEach(() => {
    run('yarn', dir);
  });

  it('transforms dependencies using specific transformers', () => {
    const {json, stderr} = runWithJson(dir, ['--no-cache']);

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
    const {json} = runWithJson(dir, ['--no-cache']);
    expect(json.success).toBe(true);
    expect(json.numTotalTests).toBeGreaterThanOrEqual(1);
  });
});

describe('transformer-config', () => {
  const dir = path.resolve(__dirname, '..', 'transform/transformer-config');

  beforeEach(() => {
    run('yarn', dir);
  });

  it('runs transpiled code', () => {
    // --no-cache because babel can cache stuff and result in false green
    const {json} = runWithJson(dir, ['--no-cache']);
    expect(json.success).toBe(true);
    expect(json.numTotalTests).toBeGreaterThanOrEqual(1);
  });

  it('instruments only specific files and collects coverage', () => {
    const {stdout} = runJest(dir, ['--coverage', '--no-cache'], {
      stripAnsi: true,
    });
    expect(stdout).toMatch('Covered.js');
    expect(stdout).not.toMatch('NotCovered.js');
    expect(stdout).not.toMatch('ExcludedFromCoverage.js');
    // coverage result should not change
    expect(wrap(stdout)).toMatchSnapshot();
  });
});

describe('transformer caching', () => {
  const dir = path.resolve(__dirname, '../transform/cache');
  const transformedFile = path.resolve(dir, './common-file.js');

  it('does not rerun transform within worker', () => {
    // --no-cache because babel can cache stuff and result in false green
    const {stdout} = runJest(dir, ['--no-cache', '-w=2']);

    const loggedFiles = stdout.split('\n');

    // Verify any lines logged are _just_ the file we care about
    loggedFiles.forEach(line => {
      expect(line).toBe(transformedFile);
    });

    // We run with 2 workers, so the file should be transformed twice
    expect(loggedFiles).toHaveLength(2);
  });
});
