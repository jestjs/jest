/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

jest.mock('graceful-fs', () => ({
  ...jest.createMockFromModule<typeof import('fs')>('fs'),
  existsSync: jest.fn().mockReturnValue(true),
}));

import * as path from 'path';
import chalk from 'chalk';
import * as fs from 'graceful-fs';
import {
  SNAPSHOT_GUIDE_LINK,
  SNAPSHOT_VERSION,
  SNAPSHOT_VERSION_WARNING,
  getSnapshotData,
  keyToNameOccurrence,
  keyToTestName,
  saveSnapshotFile,
  testNameToKey,
} from '../utils';

test('keyToTestName()', () => {
  expect(keyToTestName('abc cde 12')).toBe('abc cde');
  expect(keyToTestName('abc cde   12')).toBe('abc cde  ');
  expect(keyToTestName('test with\\r\\nCRLF 1')).toBe('test with\r\nCRLF');
  expect(keyToTestName('test with\\rCR 1')).toBe('test with\rCR');
  expect(keyToTestName('test with\\nLF 1')).toBe('test with\nLF');
  expect(() => keyToTestName('abc cde')).toThrow(
    'Snapshot keys must end with a number.',
  );
});

test('testNameToKey', () => {
  expect(testNameToKey({count: 1, testName: 'abc cde'})).toBe('abc cde 1');
  expect(testNameToKey({count: 12, testName: 'abc cde '})).toBe('abc cde  12');
});

test('testNameToKey keeps the hint out of the name', () => {
  expect(testNameToKey({count: 1, hint: 'hint', testName: 'abc'})).toBe(
    'abc \u203A hint 1',
  );
  // A colon in either half is just text; only the separator divides them.
  expect(testNameToKey({count: 1, testName: 'abc: hint'})).toBe('abc: hint 1');
  expect(testNameToKey({count: 1, hint: 'a: b', testName: 'abc'})).toBe(
    'abc \u203A a: b 1',
  );
  expect(keyToTestName('abc \u203A hint 1')).toBe('abc');
  expect(keyToTestName('abc: hint 1')).toBe('abc: hint');
});

test('testNameToKey escapes a separator inside the name', () => {
  const key = testNameToKey({count: 1, hint: 'hint', testName: 'a \u203A b'});

  expect(key).toBe('a \\u203A b \u203A hint 1');
  expect(keyToTestName(key)).toBe('a \u203A b');
});

test('testNameToKey gives each test sharing a name its own key space', () => {
  const name = 'abc cde';
  expect(testNameToKey({count: 1, nameOccurrence: 1, testName: name})).toBe(
    'abc cde 1',
  );
  expect(testNameToKey({count: 1, nameOccurrence: 2, testName: name})).toBe(
    'abc cde 2.1',
  );
  expect(testNameToKey({count: 12, nameOccurrence: 3, testName: name})).toBe(
    'abc cde 3.12',
  );

  expect(testNameToKey({count: 1, nameOccurrence: 2, testName: name})).not.toBe(
    testNameToKey({count: 2, testName: name}),
  );
  expect(
    keyToTestName(
      testNameToKey({count: 12, nameOccurrence: 3, testName: name}),
    ),
  ).toBe('abc cde');
});

test('keyToNameOccurrence recovers which namesake a key belongs to', () => {
  expect(keyToNameOccurrence('abc cde 1')).toBe(1);
  expect(keyToNameOccurrence('abc cde 12')).toBe(1);
  expect(keyToNameOccurrence('abc cde 2.1')).toBe(2);
  expect(keyToNameOccurrence('abc cde 13.12')).toBe(13);
  // A name ending in a number is not a position.
  expect(keyToNameOccurrence('abc cde 2 1')).toBe(1);
});

test('testNameToKey escapes line endings to prevent collisions', () => {
  expect(testNameToKey({count: 1, testName: 'test with\r\nCRLF'})).toBe(
    'test with\\r\\nCRLF 1',
  );
  expect(testNameToKey({count: 1, testName: 'test with\rCR'})).toBe(
    'test with\\rCR 1',
  );
  expect(testNameToKey({count: 1, testName: 'test with\nLF'})).toBe(
    'test with\\nLF 1',
  );

  expect(testNameToKey({count: 1, testName: 'test\r\n'})).not.toBe(
    testNameToKey({count: 1, testName: 'test\r'}),
  );
  expect(testNameToKey({count: 1, testName: 'test\r\n'})).not.toBe(
    testNameToKey({count: 1, testName: 'test\n'}),
  );
  expect(testNameToKey({count: 1, testName: 'test\r'})).not.toBe(
    testNameToKey({count: 1, testName: 'test\n'}),
  );
});

test('keyToTestName reverses testNameToKey transformation', () => {
  const testCases = [
    'simple test',
    'test with\r\nCRLF',
    'test with\rCR only',
    'test with\nLF only',
    'mixed\r\nline\rendings\n',
    'test\r',
    'test\r\n',
    'test\n',
  ];

  for (const testName of testCases) {
    const key = testNameToKey({count: 1, testName});
    const recovered = keyToTestName(key);
    expect(recovered).toBe(testName);
  }
});

test('saveSnapshotFile() works with \r\n', () => {
  const filename = path.join(__dirname, 'remove-newlines.snap');
  const data = {
    myKey: '<div>\r\n</div>',
  };

  saveSnapshotFile(data, filename);
  expect(fs.writeFileSync).toHaveBeenCalledWith(
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
  expect(fs.writeFileSync).toHaveBeenCalledWith(
    filename,
    `// Jest Snapshot v1, ${SNAPSHOT_GUIDE_LINK}\n\n` +
      'exports[`myKey`] = `<div>\n</div>`;\n',
  );
});

test('getSnapshotData() throws when no snapshot version', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  jest
    .mocked(fs.readFileSync)
    .mockReturnValue('exports[`myKey`] = `<div>\n</div>`;\n');
  const update = 'none';

  expect(() => getSnapshotData(filename, update)).toThrow(
    chalk.red(
      `${chalk.bold('Outdated snapshot')}: No snapshot header found. ` +
        'Jest 19 introduced versioned snapshots to ensure all developers on ' +
        'a project are using the same version of Jest. ' +
        'Please update all snapshots during this upgrade of Jest.\n\n',
    ) + SNAPSHOT_VERSION_WARNING,
  );
});

test('getSnapshotData() throws for older snapshot version', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  jest
    .mocked(fs.readFileSync)
    .mockReturnValue(
      `// Jest Snapshot v0.99, ${SNAPSHOT_GUIDE_LINK}\n\n` +
        'exports[`myKey`] = `<div>\n</div>`;\n',
    );
  const update = 'none';

  expect(() => getSnapshotData(filename, update)).toThrow(
    `${chalk.red(
      `${chalk.red.bold('Outdated snapshot')}: The version of the snapshot ` +
        'file associated with this test is outdated. The snapshot file ' +
        'version ensures that all developers on a project are using ' +
        'the same version of Jest. ' +
        'Please update all snapshots during this upgrade of Jest.',
    )}\n\nExpected: v${SNAPSHOT_VERSION}\n` +
      `Received: v0.99\n\n${SNAPSHOT_VERSION_WARNING}`,
  );
});

test.each([
  ['Linux', '\n'],
  ['Windows', '\r\n'],
])(
  'getSnapshotData() throws for newer snapshot version with %s line endings',
  (_: string, fileEol: string) => {
    const filename = path.join(__dirname, 'old-snapshot.snap');
    jest
      .mocked(fs.readFileSync)
      .mockReturnValue(
        `// Jest Snapshot v2, ${SNAPSHOT_GUIDE_LINK}${fileEol}${fileEol}` +
          `exports[\`myKey\`] = \`<div>${fileEol}</div>\`;${fileEol}`,
      );
    const update = 'none';

    expect(() => getSnapshotData(filename, update)).toThrow(
      `${chalk.red(
        `${chalk.red.bold('Outdated Jest version')}: The version of this ` +
          'snapshot file indicates that this project is meant to be used ' +
          'with a newer version of Jest. ' +
          'The snapshot file version ensures that all developers on a project ' +
          'are using the same version of Jest. ' +
          'Please update your version of Jest and re-run the tests.',
      )}\n\nExpected: v${SNAPSHOT_VERSION}\nReceived: v2`,
    );
  },
);

test('getSnapshotData() throws for deprecated snapshot guide link', () => {
  const deprecatedGuideLink = 'https://goo.gl/fbAQLP';
  const filename = path.join(__dirname, 'old-snapshot.snap');
  jest
    .mocked(fs.readFileSync)
    .mockReturnValue(
      `// Jest Snapshot v1, ${deprecatedGuideLink}\n\n` +
        'exports[`myKey`] = `<div>\n</div>`;\n',
    );
  const update = 'none';

  expect(() => getSnapshotData(filename, update)).toThrow(
    `${chalk.red(
      `${chalk.red.bold(
        'Outdated guide link',
      )}: The snapshot guide link at the top of this snapshot is outdated. ` +
        'Please update all snapshots during this upgrade of Jest.',
    )}\n\nExpected: ${SNAPSHOT_GUIDE_LINK}\n` +
      `Received: ${deprecatedGuideLink}`,
  );
});

test('getSnapshotData() does not throw for when updating', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  jest
    .mocked(fs.readFileSync)
    .mockReturnValue('exports[`myKey`] = `<div>\n</div>`;\n');
  const update = 'all';

  expect(() => getSnapshotData(filename, update)).not.toThrow();
});

test('getSnapshotData() marks invalid snapshot dirty when updating', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  jest
    .mocked(fs.readFileSync)
    .mockReturnValue('exports[`myKey`] = `<div>\n</div>`;\n');
  const update = 'all';

  expect(getSnapshotData(filename, update)).toMatchObject({dirty: true});
});

test('getSnapshotData() marks valid snapshot not dirty when updating', () => {
  const filename = path.join(__dirname, 'old-snapshot.snap');
  jest
    .mocked(fs.readFileSync)
    .mockReturnValue(
      `// Jest Snapshot v${SNAPSHOT_VERSION}, ${SNAPSHOT_GUIDE_LINK}\n\n` +
        'exports[`myKey`] = `<div>\n</div>`;\n',
    );
  const update = 'all';

  expect(getSnapshotData(filename, update)).toMatchObject({dirty: false});
});

test('escaping', () => {
  const filename = path.join(__dirname, 'escaping.snap');
  const data = '"\'\\';
  const writeFileSync = jest.mocked(fs.writeFileSync);

  writeFileSync.mockReset();
  saveSnapshotFile({key: data}, filename);
  const writtenData = writeFileSync.mock.calls[0][1];
  expect(writtenData).toBe(
    `// Jest Snapshot v1, ${SNAPSHOT_GUIDE_LINK}\n\n` +
      'exports[`key`] = `"\'\\\\`;\n',
  );

  // eslint-disable-next-line no-eval
  const readData = eval(`var exports = {}; ${writtenData} exports`);
  expect(readData).toEqual({key: data});
  const snapshotData = readData.key;
  expect(data).toEqual(snapshotData);
});
