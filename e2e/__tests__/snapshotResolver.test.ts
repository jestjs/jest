/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import runJest from '../runJest';

const snapshotDir = path.resolve(
  __dirname,
  '../snapshot-resolver/__snapshots__',
);
const snapshotFile = path.resolve(snapshotDir, 'snapshot.test.js.snap');
const esmSnapshotDir = path.resolve(
  __dirname,
  '../snapshot-resolver-esm/__snapshots__',
);
const esmSnapshotFile = path.resolve(esmSnapshotDir, 'snapshot.test.js.snap');

describe('Custom snapshot resolver', () => {
  const cleanup = (file: string, dir: string) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
    if (fs.existsSync(dir)) {
      fs.rmdirSync(dir);
    }
  };

  beforeEach(() => {
    cleanup(snapshotFile, snapshotDir);
    cleanup(esmSnapshotFile, esmSnapshotDir);
  });
  afterAll(() => {
    cleanup(snapshotFile, snapshotDir);
    cleanup(esmSnapshotFile, esmSnapshotDir);
  });

  it('Resolves snapshot files using custom resolver', () => {
    const result = runJest('snapshot-resolver', ['-w=1', '--ci=false']);

    expect(result.stderr).toMatch('1 snapshot written from 1 test suite');

    const content = require(snapshotFile);
    expect(content).toHaveProperty(
      'snapshots are written to custom location 1',
    );
  });

  it('resolves snapshot files using an ESM custom resolver', () => {
    const result = runJest('snapshot-resolver-esm', ['-w=1', '--ci=false']);

    expect(result.stderr).toMatch('1 snapshot written from 1 test suite');

    const content = require(esmSnapshotFile);
    expect(content).toHaveProperty(
      'snapshots are written using an ESM resolver 1',
    );
  });

  it('resolves snapshot files using an ESM custom resolver with jasmine2', () => {
    const result = runJest('snapshot-resolver-esm', [
      '-w=1',
      '--ci=false',
      '--testRunner=jest-jasmine2',
    ]);

    expect(result.stderr).toMatch('1 snapshot written from 1 test suite');

    const content = require(esmSnapshotFile);
    expect(content).toHaveProperty(
      'snapshots are written using an ESM resolver 1',
    );
  });
});
