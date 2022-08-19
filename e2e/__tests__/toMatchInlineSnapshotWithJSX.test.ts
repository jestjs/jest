/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {runYarnInstall} from '../Utils';
import runJest, {json as runWithJson} from '../runJest';

const DIR = path.resolve(__dirname, '../to-match-inline-snapshot-with-jsx');

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
  const normalRun = runWithJson(DIR, []);
  expect(normalRun.exitCode).toBe(1);
  expect(normalRun.stderr).toContain('1 snapshot failed from 1 test suite.');
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

  const updateSnapshotRun = runJest(DIR, ['--updateSnapshot']);

  expect(updateSnapshotRun.exitCode).toBe(0);
  expect(updateSnapshotRun.stderr).toContain('1 snapshot updated.');
});
