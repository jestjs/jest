/**
 * @flow
 */
'use strict';

const fs = require('fs');
const path = require('path');
const runJest = require('../runJest');

const snapshotDir = path.resolve(
  __dirname,
  path.join('..', 'snapshot-resolver', '__snapshots__'),
);
const snapshotFile = path.resolve(snapshotDir, 'snapshot.test.js.snap');

const fileExists = filePath => {
  try {
    return fs.statSync(filePath).isFile();
  } catch (e) {}
  return false;
};

describe('Custom snapshot resolver', () => {
  const cleanup = () => {
    [snapshotFile].forEach(file => {
      if (fileExists(file)) {
        fs.unlinkSync(file);
      }
    });
    if (fileExists(snapshotDir)) {
      fs.rmdirSync(snapshotDir);
    }
  };

  beforeEach(cleanup);
  afterAll(cleanup);

  it('Resolves snapshot files using custom resolver', () => {
    const result = runJest('snapshot-resolver');

    const info = result.stderr.toString();
    expect(info).toMatch('1 snapshot written in 1 test suite');

    // $FlowFixMe dynamic require
    const content = require(snapshotFile);
    expect(content['snapshots are written to custom location 1']).not.toBe(
      undefined,
    );
  });
});
