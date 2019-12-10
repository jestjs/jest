/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {wrap} from 'jest-snapshot-serializer-raw';
import {onNodeVersions} from '@jest/test-utils';
import {toMatchInlineSnapshot} from 'jest-snapshot';
import runJest from '../runJest';

expect.extend({
  toMatchRightTrimmedInlineSnapshot(received: string) {
    return toMatchInlineSnapshot.call(
      this,
      wrap(
        received
          .split('\n')
          .map(s => s.trimRight())
          .join('\n'),
      ),
    );
  },
});

const DIR = path.resolve(__dirname, '../v8-coverage');

onNodeVersions('>=10', () => {
  test('prints coverage', () => {
    const sourcemapDir = path.join(DIR, 'no-sourcemap');
    const {stdout, exitCode} = runJest(
      sourcemapDir,
      ['--coverage', '--coverage-provider', 'v8'],
      {
        stripAnsi: true,
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toMatchRightTrimmedInlineSnapshot(`
        console.log __tests__/Thing.test.js:10
          42

      -----------------|---------|----------|---------|---------|-------------------
      File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
      -----------------|---------|----------|---------|---------|-------------------
      All files        |     100 |      100 |      50 |     100 |
       Thing.js        |     100 |      100 |     100 |     100 |
       cssTransform.js |     100 |      100 |      50 |     100 |
       x.css           |     100 |      100 |     100 |     100 |
      -----------------|---------|----------|---------|---------|-------------------
    `);
  });
});
