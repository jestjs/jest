/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {cleanup, extractSummary, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(tmpdir(), 'custom-reporters-test-dir');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

describe('Custom Reporters Integration', () => {
  test('valid string format for adding reporters', () => {
    const reporterConfig = {
      reporters: ['<rootDir>/reporters/TestReporter.js'],
    };

    const {exitCode} = runJest('custom-reporters', [
      '--config',
      JSON.stringify(reporterConfig),
      'add.test.js',
    ]);

    expect(exitCode).toBe(0);
  });

  test('valid array format for adding reporters', () => {
    const reporterConfig = {
      reporters: [
        ['<rootDir>/reporters/TestReporter.js', {'Aaron Abramov': 'Awesome'}],
      ],
    };

    const {exitCode, stdout} = runJest('custom-reporters', [
      '--config',
      JSON.stringify(reporterConfig),
      'add.test.js',
    ]);

    expect(stdout).toMatchSnapshot();
    expect(exitCode).toBe(0);
  });

  test('invalid format for adding reporters', () => {
    const reporterConfig = {
      reporters: [[3243242]],
    };

    const {exitCode, stderr} = runJest('custom-reporters', [
      '--config',
      JSON.stringify(reporterConfig),
      'add.test.js',
    ]);

    expect(exitCode).toBe(1);
    expect(stderr).toMatchSnapshot();
  });

  test('default reporters enabled', () => {
    const {stderr, stdout, exitCode} = runJest('custom-reporters', [
      '--config',
      JSON.stringify({
        reporters: ['default', '<rootDir>/reporters/TestReporter.js'],
      }),
      'add.test.js',
    ]);

    const {summary, rest} = extractSummary(stderr);
    const parsedJSON = JSON.parse(stdout);

    expect(exitCode).toBe(0);
    expect(rest).toMatchSnapshot();
    expect(summary).toMatchSnapshot();
    expect(parsedJSON).toMatchSnapshot();
  });

  test('TestReporter with all tests passing', () => {
    const {stdout, exitCode, stderr} = runJest('custom-reporters', [
      'add.test.js',
    ]);

    const parsedJSON = JSON.parse(stdout);

    expect(exitCode).toBe(0);
    expect(stderr).toBe('');
    expect(parsedJSON).toMatchSnapshot();
  });

  test('TestReporter with all tests failing', () => {
    const {stdout, exitCode, stderr} = runJest('custom-reporters', [
      'addFail.test.js',
    ]);

    const parsedJSON = JSON.parse(stdout);

    expect(exitCode).toBe(1);
    expect(stderr).toBe('');
    expect(parsedJSON).toMatchSnapshot();
  });

  test('IncompleteReporter for flexibility', () => {
    const {stderr, stdout, exitCode} = runJest('custom-reporters', [
      '--no-cache',
      '--config',
      JSON.stringify({
        reporters: ['<rootDir>/reporters/IncompleteReporter.js'],
      }),
      'add.test.js',
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toBe('');

    expect(stdout).toMatchSnapshot();
  });

  test('reporters can be default exports', () => {
    const {stderr, stdout, exitCode} = runJest('custom-reporters', [
      '--no-cache',
      '--config',
      JSON.stringify({
        reporters: ['<rootDir>/reporters/DefaultExportReporter.js'],
      }),
      'add.test.js',
    ]);

    expect(stderr).toBe('');
    expect(exitCode).toBe(0);
    expect(stdout).toMatchSnapshot();
  });

  test('prints reporter errors', () => {
    writeFiles(DIR, {
      '__tests__/test.test.js': "test('test', () => {});",
      'package.json': JSON.stringify({
        jest: {
          reporters: ['default', '<rootDir>/reporter.js'],
        },
      }),
      'reporter.js': `
        'use strict';
        module.exports = class Reporter {
          onRunStart() {
            throw new Error('ON_RUN_START_ERROR');
          }
        };
      `,
    });

    const {stderr, exitCode} = runJest(DIR);
    expect(stderr).toMatch(/ON_RUN_START_ERROR/);
    expect(exitCode).toBe(1);
  });

  test('supports reporter written in ESM', () => {
    writeFiles(DIR, {
      '__tests__/test.test.js': "test('test', () => {});",
      'package.json': JSON.stringify({
        jest: {
          reporters: ['default', '<rootDir>/reporter.mjs'],
        },
      }),
      'reporter.mjs': `
        export default class Reporter {
          onRunStart() {
            throw new Error('ON_RUN_START_ERROR');
          }
        };
      `,
    });

    const {stderr, exitCode} = runJest(DIR);
    expect(stderr).toMatch(/ON_RUN_START_ERROR/);
    expect(exitCode).toBe(1);
  });
});
