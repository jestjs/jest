/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {wrap} from 'jest-snapshot-serializer-raw';
import {cleanup, extractSummary, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../console-log-output-when-run-in-band');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

const nodeMajorVersion = Number(process.versions.node.split('.')[0]);

test('prints console.logs when run with forceExit', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `
      test('banana', () => console.log('Hey'));
    `,
    'package.json': '{}',
  });

  const {stderr, exitCode, ...res} = runJest(DIR, [
    '-i',
    '--ci=false',
    '--forceExit',
  ]);
  let {stdout} = res;

  const {rest, summary} = extractSummary(stderr);

  if (nodeMajorVersion < 12) {
    expect(stdout).toContain(
      'at Object.<anonymous>.test (__tests__/a-banana.js:1:1)',
    );

    stdout = stdout.replace(
      'at Object.<anonymous>.test (__tests__/a-banana.js:1:1)',
      'at Object.<anonymous> (__tests__/a-banana.js:1:1)',
    );
  }

  expect(exitCode).toBe(0);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(wrap(stdout)).toMatchSnapshot();
});
