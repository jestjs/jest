/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {cleanup, runYarnInstall, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../to-match-inline-snapshot-crlf');
const TESTS_DIR = path.resolve(DIR, '__tests__');
const JEST_CONFIG_PATH = path.resolve(DIR, 'jest.config.js');
const PRETTIER_RC_PATH = path.resolve(DIR, '.prettierrc');

const readFile = (filename: string) =>
  fs.readFileSync(path.join(TESTS_DIR, filename), 'utf8');

beforeAll(() => {
  runYarnInstall(DIR);
});
beforeEach(() => {
  cleanup(TESTS_DIR);
  cleanup(JEST_CONFIG_PATH);
  cleanup(PRETTIER_RC_PATH);
});
afterAll(() => {
  cleanup(TESTS_DIR);
  cleanup(JEST_CONFIG_PATH);
  cleanup(PRETTIER_RC_PATH);
});

test('prettier with crlf newlines', () => {
  writeFiles(DIR, {
    'jest.config.js': `
        module.exports = {prettierPath: require.resolve('prettier')};
      `,
  });
  writeFiles(DIR, {
    '.prettierrc': '{"endOfLine": "crlf"}',
  });
  writeFiles(TESTS_DIR, {
    'test.ts': `test('snapshots', () => {
    expect({test: 1}).toMatchInlineSnapshot();

    expect({test: 2}).toMatchInlineSnapshot();
  });
`.replaceAll('\n', '\r\n'),
  });
  const {stderr, exitCode} = runJest(DIR, ['--ci=false']);
  expect(stderr).toContain('Snapshots:   2 written, 2 total');
  expect(exitCode).toBe(0);

  const fileAfter = readFile('test.ts');
  expect(fileAfter).toBe(
    `test("snapshots", () => {
  expect({ test: 1 }).toMatchInlineSnapshot(\`
    {
      "test": 1,
    }
  \`);

  expect({ test: 2 }).toMatchInlineSnapshot(\`
    {
      "test": 2,
    }
  \`);
});
`.replaceAll('\n', '\r\n'),
  );
});
