/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import slash = require('slash');
import {runYarnInstall} from '../Utils';
import {json as runWithJson} from '../runJest';

const DIR = path.resolve(__dirname, '..', 'to-match-inline-snapshot-with-jsx');

function cleanup() {
  fs.copyFileSync(
    path.join(DIR, 'MismatchingSnapshot.original.js'),
    path.join(DIR, '__tests__/MismatchingSnapshot.test.js'),
  );
}

beforeEach(() => {
  runYarnInstall(DIR);
  cleanup();
});

afterAll(() => {
  cleanup();
});

it('successfully runs the tests inside `to-match-inline-snapshot-with-jsx/`', () => {
  const updateSnapshotRun = runWithJson(DIR, ['--updateSnapshot']);
  expect(
    updateSnapshotRun.json.testResults[0].message.replace(
      new RegExp(`${process.cwd()}[^:]*`),
      match => slash(match.replace(process.cwd(), '<rootDir>')),
    ),
  ).toMatchInlineSnapshot(`
    "  ● Test suite failed to run

        SyntaxError: <rootDir>/e2e/to-match-inline-snapshot-with-jsx/__tests__/MismatchingSnapshot.test.js: Support for the experimental syntax 'jsx' isn't currently enabled (12:26):

          10 |
          11 | test('<div>x</div>', () => {
        > 12 |   expect(renderer.create(<div>x</div>).toJSON()).toMatchInlineSnapshot(\`
             |                          ^
          13 |     <div>
          14 |       y
          15 |     </div>

        Add @babel/preset-react (https://github.com/babel/babel/tree/main/packages/babel-preset-react) to the 'presets' section of your Babel config to enable transformation.
        If you want to leave it as-is, add @babel/plugin-syntax-jsx (https://github.com/babel/babel/tree/main/packages/babel-plugin-syntax-jsx) to the 'plugins' section to enable parsing.

          at instantiate (../../node_modules/@babel/parser/src/parse-error/credentials.ts:62:21)
    "
  `);

  const normalRun = runWithJson(DIR, []);
  expect(normalRun.json.testResults[0].message).toMatchInlineSnapshot(`
    "  ● <div>x</div>

        expect(received).toMatchInlineSnapshot(snapshot)

        Snapshot name: \`<div>x</div> 1\`

        - Snapshot  - 1
        + Received  + 1

          <div>
        -   y
        +   x
          </div>

          10 |
          11 | test('<div>x</div>', () => {
        > 12 |   expect(renderer.create(<div>x</div>).toJSON()).toMatchInlineSnapshot(\`
             |                                                  ^
          13 |     <div>
          14 |       y
          15 |     </div>

          at Object.toMatchInlineSnapshot (__tests__/MismatchingSnapshot.test.js:12:50)
    "
  `);
});
