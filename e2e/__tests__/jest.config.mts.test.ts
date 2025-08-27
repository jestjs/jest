/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {onNodeVersions} from '@jest/test-utils';
import {cleanup, extractSummary, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../jest-config-ts');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

onNodeVersions('<20.19.0', () => {
  test('does not work with jest.config.mts when require(esm) is not supported', () => {
    writeFiles(DIR, {
      '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
      'jest.config.mts':
        "export default {testEnvironment: 'jest-environment-node', testRegex: '.*-giraffe.js'};",
      'package.json': '{}',
    });

    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false'], {
      nodeOptions: '--no-warnings',
    });
    expect(
      stderr
        // Remove the stack trace from the error message
        .slice(0, Math.max(0, stderr.indexOf('at readConfigFileAndSetRootDir')))
        .trim()
        // Replace the path to the config file with a placeholder
        .replace(
          /(Error: Jest: Failed to parse the TypeScript config file).*$/m,
          '$1 <<REPLACED>>',
        )
        // Replace Node version with
        .replace(/(Current Node version) (.+?) /m, '$1 <<REPLACED>> '),
    ).toMatchSnapshot();
    expect(exitCode).toBe(1);
  });
});

onNodeVersions('^20.19.0 || >=22.12.0 <23.6.0', () => {
  test('work with untyped jest.config.mts', () => {
    writeFiles(DIR, {
      '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
      'jest.config.mts':
        "export default {testEnvironment: 'jest-environment-node', testRegex: '.*-giraffe.js'};",
      'package.json': '{}',
    });

    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false'], {
      nodeOptions: '--no-warnings',
    });
    const {rest, summary} = extractSummary(stderr);
    expect(exitCode).toBe(0);
    expect(rest).toMatchSnapshot();
    expect(summary).toMatchSnapshot();
  });

  test('does not work with typed jest.config.ts', () => {
    writeFiles(DIR, {
      '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
      'jest.config.mts': `
        import {Config} from 'jest';
        const config: Config = {testEnvironment: 'jest-environment-node', testRegex: '.*-giraffe.js' };
        export default config;
      `,
      'package.json': '{}',
    });

    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false'], {
      nodeOptions: '--no-warnings',
    });
    expect(
      stderr
        // Remove the stack trace from the error message
        .slice(0, Math.max(0, stderr.indexOf('at readConfigFileAndSetRootDir')))
        .trim()
        // Replace the path to the config file with a placeholder
        .replace(
          /(Error: Jest: Failed to parse the TypeScript config file).*$/m,
          '$1 <<REPLACED>>',
        )
        // Replace Node version with
        .replace(/(Current Node version) (.+?) /m, '$1 <<REPLACED>> '),
    ).toMatchSnapshot();
    expect(exitCode).toBe(1);
  });

  test('invalid JS in jest.config.mts', () => {
    writeFiles(DIR, {
      '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
      'jest.config.mts': "export default i'll break this file yo",
      'package.json': '{}',
    });

    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
    expect(stderr).toMatch('SyntaxError: Invalid or unexpected token');
    expect(exitCode).toBe(1);
  });
});

onNodeVersions('^23.6', () => {
  test('work with untyped jest.config.mts', () => {
    writeFiles(DIR, {
      '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
      'jest.config.mts':
        "export default {testEnvironment: 'jest-environment-node', testRegex: '.*-giraffe.js'};",
      'package.json': '{}',
    });

    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false'], {
      nodeOptions: '--no-warnings',
    });
    const {rest, summary} = extractSummary(stderr);
    expect(exitCode).toBe(0);
    expect(rest).toMatchSnapshot();
    expect(summary).toMatchSnapshot();
  });

  test('works with typed jest.config.mts', () => {
    writeFiles(DIR, {
      '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
      'jest.config.mts': `
        import {Config} from 'jest';
        const config: Config = {testEnvironment: 'jest-environment-node', testRegex: '.*-giraffe.js' };
        export default config;
      `,
      'package.json': '{"type": "commonjs"}',
    });

    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false'], {
      nodeOptions: '--no-warnings',
    });
    const {rest, summary} = extractSummary(stderr);
    expect(exitCode).toBe(0);
    expect(rest).toMatchSnapshot();
    expect(summary).toMatchSnapshot();
  });

  test('works with tsconfig.json', () => {
    writeFiles(DIR, {
      '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
      'jest.config.mts':
        "export default {testEnvironment: 'jest-environment-node', testRegex: '.*-giraffe.js'};",
      'package.json': '{}',
      'tsconfig.json': '{ "compilerOptions": { "module": "esnext" } }',
    });

    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false'], {
      nodeOptions: '--no-warnings',
    });
    const {rest, summary} = extractSummary(stderr);
    expect(exitCode).toBe(0);
    expect(rest).toMatchSnapshot();
    expect(summary).toMatchSnapshot();
  });

  test('traverses directory tree up until it finds jest.config', () => {
    writeFiles(DIR, {
      '__tests__/a-giraffe.js': `
      const slash = require('slash');
      test('giraffe', () => expect(1).toBe(1));
      test('abc', () => console.log(slash(process.cwd())));
      `,
      'jest.config.mts':
        "export default {testEnvironment: 'jest-environment-node', testRegex: '.*-giraffe.js'};",
      'package.json': '{}',
      'some/nested/directory/file.js': '// nothing special',
    });

    const {stderr, exitCode, stdout} = runJest(
      path.join(DIR, 'some', 'nested', 'directory'),
      ['-w=1', '--ci=false'],
      {nodeOptions: '--no-warnings', skipPkgJsonCheck: true},
    );

    // Snapshot the console.logged `process.cwd()` and make sure it stays the same
    expect(
      stdout
        .replaceAll(/^\W+(.*)e2e/gm, '<<REPLACED>>')
        // slightly different log in node versions >= 23
        .replace('at Object.log', 'at Object.<anonymous>'),
    ).toMatchSnapshot();

    const {rest, summary} = extractSummary(stderr);
    expect(exitCode).toBe(0);
    expect(rest).toMatchSnapshot();
    expect(summary).toMatchSnapshot();
  });

  test('invalid JS in jest.config.mts (node with native TS support)', () => {
    writeFiles(DIR, {
      '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
      'jest.config.mts': "export default i'll break this file yo",
      'package.json': '{}',
    });

    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false'], {
      nodeOptions: '--no-warnings',
    });
    expect(
      stderr
        // Remove the stack trace from the error message
        .slice(0, Math.max(0, stderr.indexOf('at readConfigFileAndSetRootDir')))
        .trim()
        // Replace the path to the config file with a placeholder
        .replace(
          /(Error: Jest: Failed to parse the TypeScript config file).*$/m,
          '$1 <<REPLACED>>',
        ),
    ).toMatchSnapshot();
    expect(exitCode).toBe(1);
  });
});

onNodeVersions('>=24', () => {
  // todo fixme
  // eslint-disable-next-line jest/no-identical-title
  test('invalid JS in jest.config.mts (node with native TS support)', () => {
    writeFiles(DIR, {
      '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
      'jest.config.mts': "export default i'll break this file yo",
      'package.json': '{}',
    });

    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false'], {
      nodeOptions: '--no-warnings',
    });
    expect(
      stderr
        // Remove the stack trace from the error message
        .slice(0, Math.max(0, stderr.indexOf('at readConfigFileAndSetRootDir')))
        .trim()
        // Replace the path to the config file with a placeholder
        .replace(
          /(Error: Jest: Failed to parse the TypeScript config file).*$/m,
          '$1 <<REPLACED>>',
        ),
    ).toMatchSnapshot();
    expect(exitCode).toBe(1);
  });
});
