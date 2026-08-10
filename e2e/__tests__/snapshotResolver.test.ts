/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import runJest from '../runJest';

const makeCleanup = (dir: string) => () => {
  const snapshotDir = path.resolve(__dirname, `../${dir}/__snapshots__`);
  const snapshotFile = path.resolve(snapshotDir, 'snapshot.test.js.snap');

  if (fs.existsSync(snapshotFile)) {
    fs.unlinkSync(snapshotFile);
  }
  if (fs.existsSync(snapshotDir)) {
    fs.rmdirSync(snapshotDir);
  }
};

const assertResolvesToCustomLocation = (dir: string) => {
  const result = runJest(dir, ['-w=1', '--ci=false']);

  expect(result.stderr).toMatch('1 snapshot written from 1 test suite');

  const content = require(
    path.resolve(__dirname, `../${dir}/__snapshots__/snapshot.test.js.snap`),
  );
  expect(content).toHaveProperty('snapshots are written to custom location 1');
};

describe('Custom snapshot resolver', () => {
  const cleanup = makeCleanup('snapshot-resolver');

  beforeEach(cleanup);
  afterAll(cleanup);

  it('Resolves snapshot files using custom resolver', () => {
    assertResolvesToCustomLocation('snapshot-resolver');
  });
});

describe('Custom snapshot resolver written in ESM', () => {
  const cleanup = makeCleanup('snapshot-resolver-esm');

  beforeEach(cleanup);
  afterAll(cleanup);

  it('Resolves snapshot files using custom resolver', () => {
    assertResolvesToCustomLocation('snapshot-resolver-esm');
  });
});
