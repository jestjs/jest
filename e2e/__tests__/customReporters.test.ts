/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {readFileSync} from 'graceful-fs';
import type {FormattedTestResults} from '@jest/test-result';
import {
  cleanup,
  extractSummary,
  generateTestFilesToForceUsingWorkers,
  writeFiles,
} from '../Utils';
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
      reporters: [[3_243_242]],
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

  test.each([
    ['in band', ['--runInBand']],
    ['process workers', ['--maxWorkers=2']],
    ['worker threads', ['--maxWorkers=2', '--workerThreads']],
  ])('receives portable matcher metadata with %s', (_mode, args) => {
    writeFiles(DIR, {
      ...generateTestFilesToForceUsingWorkers(),
      '__tests__/matcher.test.js': `
        expect.extend({
          toHaveImageDiff(_received, metadata, pass = false) {
            this.dontThrow();
            return {
              message: () => 'images differ',
              metadata,
              pass,
            };
          },
          async toHaveAsyncImageDiff() {
            return {
              message: () => 'async images differ',
              metadata: {diffPath: 'async-diff.png'},
              pass: false,
            };
          },
        });

        test('reports matcher metadata', () => {
          const metadata = {diffPath: 'first-diff.png'};
          expect('first').toHaveImageDiff(metadata);
          metadata.diffPath = 'changed.png';
          expect('second').not.toHaveImageDiff({diffPath: 'second-diff.png'}, true);
        });
        test('reports async metadata', async () => {
          await expect('image').toHaveAsyncImageDiff();
        });
        test('ignores invalid metadata', () => {
          const circular = {};
          circular.self = circular;
          expect('image').toHaveImageDiff(circular);
          expect('image').toHaveImageDiff({value: 1n});
        });
        test('normalizes metadata', () => {
          expect('image').toHaveImageDiff({
            diffPath: 'normalized.png',
            fn: () => {},
            symbol: Symbol('image'),
            values: [undefined, Infinity],
          });
        });
        test('passes', () => expect('image').toHaveImageDiff({}, true));
        test('ordinary failure', () => {throw new Error('ordinary failure');});
        test.skip('skipped', () => {});
      `,
      'package.json': JSON.stringify({
        jest: {
          reporters: ['<rootDir>/reporter.js'],
        },
      }),
      'reporter.js': `
        'use strict';
        const {writeFileSync} = require(${JSON.stringify(require.resolve('graceful-fs'))});
        const {join} = require('path');
        module.exports = class Reporter {
          constructor(globalConfig) {
            this.rootDir = globalConfig.rootDir;
            this.events = [];
            this.results = [];
          }
          onTestCaseResult(_, testCaseResult) {
            this.events.push(testCaseResult);
          }
          onTestResult(_, testResult) {
            if (testResult.testFilePath.endsWith('matcher.test.js')) {
              this.results = testResult.testResults;
            }
          }
          onRunComplete() {
            const select = ({fullName, matcherResults, status}) => ({
              fullName, matcherResults, status,
            });
            writeFileSync(join(this.rootDir, 'reporter-results.json'), JSON.stringify({
              events: this.events.map(select),
              results: this.results.map(select),
            }));
          }
        };
      `,
    });

    const outputFile = path.join(DIR, 'results.json');
    const {exitCode, stderr} = runJest(DIR, [
      '--no-cache',
      '--json',
      '--outputFile',
      outputFile,
      ...args,
    ]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain('Test results written to');
    const reporter = JSON.parse(
      readFileSync(path.join(DIR, 'reporter-results.json'), 'utf8'),
    );
    const json: FormattedTestResults = JSON.parse(
      readFileSync(outputFile, 'utf8'),
    );
    const assertions = json.testResults.find(result =>
      result.name.endsWith('matcher.test.js'),
    )!.assertionResults;
    const expected = [
      {
        fullName: 'reports matcher metadata',
        matcherResults: [
          {
            message: 'images differ',
            metadata: {diffPath: 'first-diff.png'},
            pass: false,
          },
          {
            message: 'images differ',
            metadata: {diffPath: 'second-diff.png'},
            pass: true,
          },
        ],
        status: 'failed',
      },
      {
        fullName: 'reports async metadata',
        matcherResults: [
          {
            message: 'async images differ',
            metadata: {diffPath: 'async-diff.png'},
            pass: false,
          },
        ],
        status: 'failed',
      },
      {
        fullName: 'ignores invalid metadata',
        matcherResults: [
          {message: 'images differ', pass: false},
          {message: 'images differ', pass: false},
        ],
        status: 'failed',
      },
      {
        fullName: 'normalizes metadata',
        matcherResults: [
          {
            message: 'images differ',
            metadata: {diffPath: 'normalized.png', values: [null, null]},
            pass: false,
          },
        ],
        status: 'failed',
      },
      {fullName: 'passes', status: 'passed'},
      {fullName: 'ordinary failure', status: 'failed'},
      {fullName: 'skipped', status: 'pending'},
    ];

    expect(reporter.results).toEqual(expected);
    expect(reporter.events).toEqual(
      expect.arrayContaining(
        expected.filter(result => result.status !== 'pending'),
      ),
    );
    expect(assertions).toMatchObject(expected);
    expect(json.numFailedTests).toBe(5);
    expect(
      assertions
        .find(result => result.fullName === 'ignores invalid metadata')!
        .failureMessages!.join('\n'),
    ).toContain('images differ');
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
