/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import runJest from '../runJest';
import {tmpdir} from 'os';
import {cleanup, createEmptyPackage, writeFiles} from '../Utils';

const testRootDir = path.resolve(__dirname, '..', '..');

const normalizePaths = (rawPaths: string) =>
  rawPaths
    .split(testRootDir)
    .join(`${path.sep}MOCK_ABSOLUTE_PATH`)
    .split('\\')
    .join('/');

describe('--listTests flag', () => {
  it('causes tests to be printed in different lines', () => {
    const {exitCode, stdout} = runJest('list-tests', ['--listTests']);

    expect(exitCode).toBe(0);
    expect(
      normalizePaths(stdout).split('\n').sort().join('\n'),
    ).toMatchSnapshot();
  });

  it('causes tests to be printed out as JSON when using the --json flag', () => {
    const {exitCode, stdout} = runJest('list-tests', ['--listTests', '--json']);

    expect(exitCode).toBe(0);
    expect(() => JSON.parse(stdout)).not.toThrow();
    expect(
      JSON.stringify(JSON.parse(stdout).map(normalizePaths).sort()),
    ).toMatchSnapshot();
  });

  describe('--outputFile flag', () => {
    const outputFilePath = path.resolve('.', 'test-lists.json');
    afterAll(() => {
      fs.unlinkSync(outputFilePath);
    });
    it('causes tests to be saved in the file as JSON', () => {
      const {exitCode, stdout} = runJest('list-tests', [
        '--listTests',
        '--json',
        '--outputFile',
        outputFilePath,
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toBe('');

      const outputFileExists = fs.existsSync(outputFilePath);
      expect(outputFileExists).toBe(true);

      const outputFileContent = fs.readFileSync(outputFilePath, 'utf8');
      expect(() => JSON.parse(outputFileContent)).not.toThrow();
      expect(
        JSON.stringify(
          JSON.parse(outputFileContent).map(normalizePaths).sort(),
        ),
      ).toMatchSnapshot();
    });

    it('causes tests to be saved in the file in different lines', () => {
      const {exitCode, stdout} = runJest('list-tests', [
        '--listTests',
        '--outputFile',
        outputFilePath,
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toBe('');

      const outputFileExists = fs.existsSync(outputFilePath);
      expect(outputFileExists).toBe(true);

      const outputFileContent = fs.readFileSync(outputFilePath, 'utf8');
      expect(
        normalizePaths(outputFileContent).split('\n').sort().join('\n'),
      ).toMatchSnapshot();
    });
  });

  describe('--onlyFailures flag', () => {
    const tempDir = path.resolve(tmpdir(), 'temp-only-failures');

    beforeEach(() => {
      // Clean up any existing temp directory and create a new one
      cleanup(tempDir);
      createEmptyPackage(tempDir, {jest: {testEnvironment: 'node'}});

      // Create test files
      writeFiles(tempDir, {
        'failing.test.js':
          'test("failing test", () => { expect(true).toBe(false); });',
        'passing.test.js':
          'test("passing test", () => { expect(true).toBe(true); });',
      });
    });

    afterEach(() => {
      cleanup(tempDir);
    });

    it('lists only failed tests after a test run', () => {
      runJest(tempDir);

      const {exitCode, stdout} = runJest(tempDir, [
        '--listTests',
        '--onlyFailures',
      ]);

      expect(exitCode).toBe(0);
      const listedTests = stdout
        .trim()
        .split('\n')
        .filter(line => line.length > 0);
      expect(listedTests).toHaveLength(1);
      expect(listedTests[0]).toMatch(/failing\.test\.js$/);
      expect(stdout).not.toMatch(/passing\.test\.js$/);
    });

    it('lists no tests when no failed tests exist', () => {
      const {exitCode, stdout} = runJest('list-tests', [
        '--listTests',
        '--onlyFailures',
      ]);

      expect(exitCode).toBe(0);
      expect(stdout.trim()).toBe('');
    });
  });
});
