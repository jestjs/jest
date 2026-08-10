/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {onNodeVersions} from '@jest/test-utils';
import {cleanup, extractSummary, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../jest-config-ts');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('works with jest.config.ts', () => {
  writeFiles(DIR, {
    '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
    'jest.config.ts':
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

test('falls back to a loader if we encounter a ESM TS config file in a CommonJs project', () => {
  writeFiles(DIR, {
    '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
    'jest.config.ts':
      "export default {testEnvironment: 'jest-environment-node', testRegex: '.*-giraffe.js'};",
    'package.json': '{"type":"commonjs"}',
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
    'jest.config.ts':
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
    'jest.config.ts':
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

onNodeVersions('<23.6', () => {
  const jestPath = require.resolve('jest');
  const jestTypesPath = jestPath.replace(/\.js$/, '.d.ts');
  const jestTypesExists = fs.existsSync(jestTypesPath);

  (jestTypesExists ? test : test.skip).each([true, false])(
    'check the config disabled (skip type check: %p)',
    skipTypeCheck => {
      writeFiles(DIR, {
        '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
        'jest.config.ts': `
        /**@jest-config-loader-options {"transpileOnly":${skipTypeCheck}}*/
        import {Config} from 'jest';
        const config: Config = { testTimeout: "10000" };
        export default config;
      `,
        'package.json': '{}',
        'tsconfig.json': '{}',
      });

      const typeErrorString =
        "TS2322: Type 'string' is not assignable to type 'number'.";
      const runtimeErrorString = 'Option "testTimeout" must be of type:';

      const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);

      if (skipTypeCheck) {
        expect(stderr).not.toMatch(typeErrorString);
        expect(stderr).toMatch(runtimeErrorString);
      } else {
        expect(stderr).toMatch(typeErrorString);
        expect(stderr).not.toMatch(runtimeErrorString);
      }

      expect(exitCode).toBe(1);
    },
  );

  test('invalid JS in jest.config.ts', () => {
    writeFiles(DIR, {
      '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
      'jest.config.ts': "export default i'll break this file yo",
      'package.json': '{}',
    });

    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false']);
    expect(stderr).toMatch('TSError: ⨯ Unable to compile TypeScript:');
    expect(exitCode).toBe(1);
  });
});

onNodeVersions('^23.6', () => {
  test('invalid JS in jest.config.ts (node with native TS support)', () => {
    writeFiles(DIR, {
      '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
      'jest.config.ts': "export default i'll break this file yo",
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

  test('load typed jest.config.ts with TS loader specified in docblock pragma', () => {
    writeFiles(DIR, {
      '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
      'foo.ts': 'export const a = () => {};',
      'jest.config.ts': `
        /** @jest-config-loader ts-node */
        import { a } from './foo'
        a();
        import type {Config} from 'jest';
        const config: Config = { testTimeout: 10000 };
        export default config;
      `,
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
});

onNodeVersions('>=24', () => {
  // todo fixme
  // eslint-disable-next-line jest/no-identical-title
  test('invalid JS in jest.config.ts (node with native TS support)', () => {
    writeFiles(DIR, {
      '__tests__/a-giraffe.js': "test('giraffe', () => expect(1).toBe(1));",
      'jest.config.ts': "export default i'll break this file yo",
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
