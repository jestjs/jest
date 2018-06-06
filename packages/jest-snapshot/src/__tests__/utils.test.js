/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

jest.mock('fs');
jest.mock('prettier');

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const {
  getSnapshotData,
  getSnapshotPath,
  saveInlineSnapshots,
  keyToTestName,
  saveSnapshotFile,
  serialize,
  testNameToKey,
  SNAPSHOT_GUIDE_LINK,
  SNAPSHOT_VERSION,
  SNAPSHOT_VERSION_WARNING,
} = require('../utils');

const writeFileSync = fs.writeFileSync;
const readFileSync = fs.readFileSync;
const existsSync = fs.existsSync;
const statSync = fs.statSync;
const readdirSync = fs.readdirSync;
beforeEach(() => {
  fs.writeFileSync = jest.fn();
  fs.readFileSync = jest.fn();
  fs.existsSync = jest.fn(() => true);
  fs.statSync = jest.fn(filePath => ({
    isDirectory: () => !filePath.endsWith('.js'),
  }));
  fs.readdirSync = jest.fn(() => []);
});
afterEach(() => {
  fs.writeFileSync = writeFileSync;
  fs.readFileSync = readFileSync;
  fs.existsSync = existsSync;
  fs.statSync = statSync;
  fs.readdirSync = readdirSync;
});

test('keyToTestName()', () => {
  expect(keyToTestName('abc cde 12')).toBe('abc cde');
  expect(keyToTestName('abc cde   12')).toBe('abc cde  ');
  expect(() => keyToTestName('abc cde')).toThrowError(
    'Snapshot keys must end with a number.',
  );
});

test('testNameToKey', () => {
  expect(testNameToKey('abc cde', 1)).toBe('abc cde 1');
  expect(testNameToKey('abc cde ', 12)).toBe('abc cde  12');
});

test('getSnapshotPath()', () => {
  expect(getSnapshotPath('/abc/cde/a.test.js')).toBe(
    path.join('/abc', 'cde', '__snapshots__', 'a.test.js.snap'),
  );
});

test('saveSnapshotFile() works with \r\n', () => {
  const filename = path.join(__dirname, 'remove-newlines.snap');
  const data = {
    myKey: '<div>\r\n</div>',
  };

  saveSnapshotFile(data, filename);
  expect(fs.writeFileSync).toBeCalledWith(
    filename,
    `// Jest Snapshot v1, ${SNAPSHOT_GUIDE_LINK}\n\n` +
      'exports[`myKey`] = `<div>\n</div>`;\n',
  );
});

test('saveSnapshotFile() works with \r', () => {
  const filename = path.join(__dirname, 'remove-newlines.snap');
  const data = {
    myKey: '<div>\r</div>',
  };

  saveSnapshotFile(data, filename);
  expect(fs.writeFileSync).toBeCalledWith(
    filename,
    `// Jest Snapshot v1, ${SNAPSHOT_GUIDE_LINK}\n\n` +
      'exports[`myKey`] = `<div>\n</div>`;\n',
  );
});

test('saveInlineSnapshots() replaces empty function call with a template literal', () => {
  const filename = path.join(__dirname, 'my.test.js');
  fs.readFileSync = jest.fn(() => `expect(1).toMatchInlineSnapshot();\n`);

  saveInlineSnapshots([
    {
      frame: {column: 11, file: filename, line: 1},
      snapshot: `1`,
    },
  ]);

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    'expect(1).toMatchInlineSnapshot(`1`);\n',
  );
});

test('saveInlineSnapshots() replaces existing template literal', () => {
  const filename = path.join(__dirname, 'my.test.js');
  fs.readFileSync = jest.fn(() => 'expect(1).toMatchInlineSnapshot(`2`);\n');

  saveInlineSnapshots([
    {
      frame: {column: 11, file: filename, line: 1},
      snapshot: `1`,
    },
  ]);

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    'expect(1).toMatchInlineSnapshot(`1`);\n',
  );
});

test('saveInlineSnapshots() replaces existing template literal with property matchers', () => {
  const filename = path.join(__dirname, 'my.test.js');
  fs.readFileSync = jest.fn(
    () => 'expect(1).toMatchInlineSnapshot({}, `2`);\n',
  );

  saveInlineSnapshots([
    {
      frame: {column: 11, file: filename, line: 1},
      snapshot: `1`,
    },
  ]);

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    'expect(1).toMatchInlineSnapshot({}, `1`);\n',
  );
});

test('saveInlineSnapshots() throws if frame does not match', () => {
  const filename = path.join(__dirname, 'my.test.js');
  fs.readFileSync = jest.fn(() => 'expect(1).toMatchInlineSnapshot();\n');

  const save = () =>
    saveInlineSnapshots([
      {
        frame: {column: 2 /* incorrect */, file: filename, line: 1},
        snapshot: `1`,
      },
    ]);

  expect(save).toThrowError(/Couldn't locate all inline snapshots./);
});

test('saveInlineSnapshots() throws if multiple calls to to the same location', () => {
  const filename = path.join(__dirname, 'my.test.js');
  fs.readFileSync = jest.fn(() => 'expect(1).toMatchInlineSnapshot();\n');

  const frame = {column: 11, file: filename, line: 1};
  const save = () =>
    saveInlineSnapshots([{frame, snapshot: `1`}, {frame, snapshot: `2`}]);

  expect(save).toThrowError(
    /Multiple inline snapshots for the same call are not supported./,
  );
});

test('saveInlineSnapshots() uses escaped backticks', () => {
  const filename = path.join(__dirname, 'my.test.js');
  fs.readFileSync = jest.fn(() => 'expect("`").toMatchInlineSnapshot();\n');

  const frame = {column: 13, file: filename, line: 1};
  saveInlineSnapshots([{frame, snapshot: '`'}]);

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    'expect("`").toMatchInlineSnapshot(`\\``);\n',
  );
});

test('getSnapshotData() throws when no snapshot version', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  fs.readFileSync = jest.fn(() => 'exports[`myKey`] = `<div>\n</div>`;\n');
  const update = 'none';

  expect(() => getSnapshotData(filename, update)).toThrowError(
    chalk.red(
      `${chalk.bold('Outdated snapshot')}: No snapshot header found. ` +
        `Jest 19 introduced versioned snapshots to ensure all developers on ` +
        `a project are using the same version of Jest. ` +
        `Please update all snapshots during this upgrade of Jest.\n\n`,
    ) + SNAPSHOT_VERSION_WARNING,
  );
});

test('getSnapshotData() throws for older snapshot version', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  fs.readFileSync = jest.fn(
    () =>
      `// Jest Snapshot v0.99, ${SNAPSHOT_GUIDE_LINK}\n\n` +
      'exports[`myKey`] = `<div>\n</div>`;\n',
  );
  const update = 'none';

  expect(() => getSnapshotData(filename, update)).toThrowError(
    chalk.red(
      `${chalk.red.bold('Outdated snapshot')}: The version of the snapshot ` +
        `file associated with this test is outdated. The snapshot file ` +
        `version ensures that all developers on a project are using ` +
        `the same version of Jest. ` +
        `Please update all snapshots during this upgrade of Jest.\n\n`,
    ) +
      `Expected: v${SNAPSHOT_VERSION}\n` +
      `Received: v0.99\n\n` +
      SNAPSHOT_VERSION_WARNING,
  );
});

test('getSnapshotData() throws for newer snapshot version', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  fs.readFileSync = jest.fn(
    () =>
      `// Jest Snapshot v2, ${SNAPSHOT_GUIDE_LINK}\n\n` +
      'exports[`myKey`] = `<div>\n</div>`;\n',
  );
  const update = 'none';

  expect(() => getSnapshotData(filename, update)).toThrowError(
    chalk.red(
      `${chalk.red.bold('Outdated Jest version')}: The version of this ` +
        `snapshot file indicates that this project is meant to be used ` +
        `with a newer version of Jest. ` +
        `The snapshot file version ensures that all developers on a project ` +
        `are using the same version of Jest. ` +
        `Please update your version of Jest and re-run the tests.\n\n`,
    ) +
      `Expected: v${SNAPSHOT_VERSION}\n` +
      `Received: v2`,
  );
});

test('getSnapshotData() does not throw for when updating', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  fs.readFileSync = jest.fn(() => 'exports[`myKey`] = `<div>\n</div>`;\n');
  const update = 'all';

  expect(() => getSnapshotData(filename, update)).not.toThrow();
});

test('getSnapshotData() marks invalid snapshot dirty when updating', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  fs.readFileSync = jest.fn(() => 'exports[`myKey`] = `<div>\n</div>`;\n');
  const update = 'all';

  expect(getSnapshotData(filename, update)).toMatchObject({dirty: true});
});

test('getSnapshotData() marks valid snapshot not dirty when updating', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  fs.readFileSync = jest.fn(
    () =>
      `// Jest Snapshot v${SNAPSHOT_VERSION}, ${SNAPSHOT_GUIDE_LINK}\n\n` +
      'exports[`myKey`] = `<div>\n</div>`;\n',
  );
  const update = 'all';

  expect(getSnapshotData(filename, update)).toMatchObject({dirty: false});
});

test('escaping', () => {
  const filename = path.join(__dirname, 'escaping.snap');
  const data = '"\'\\';
  saveSnapshotFile({key: data}, filename);
  const writtenData = fs.writeFileSync.mock.calls[0][1];
  expect(writtenData).toBe(
    `// Jest Snapshot v1, ${SNAPSHOT_GUIDE_LINK}\n\n` +
      'exports[`key`] = `"\'\\\\`;\n',
  );

  // eslint-disable-next-line no-unused-vars
  const exports = {};
  // eslint-disable-next-line no-eval
  const readData = eval('var exports = {}; ' + writtenData + ' exports');
  expect(readData).toEqual({key: data});
  const snapshotData = readData.key;
  expect(data).toEqual(snapshotData);
});

test('serialize handles \\r\\n', () => {
  const data = '<div>\r\n</div>';
  const serializedData = serialize(data);

  expect(serializedData).toBe('\n"<div>\n</div>"\n');
});
