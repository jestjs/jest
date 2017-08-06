const getFailedSnapshotTests = require('../get_failed_snapshot_tests');

test('return a list of path', () => {
  const targetFilename = 'somewhere.js';
  const param = {
    numFailedTests: 1,
    testResults: [
      {
        snapshot: {
          unmatched: 1,
        },
        testFilePath: targetFilename,
      },
    ],
  };
  expect(getFailedSnapshotTests(param)).toEqual([targetFilename]);
});

test('handle missing snapshot object', () => {
  const targetFilename = 'somewhere.js';
  const param = {
    numFailedTests: 1,
    testResults: [
      {
        testFilePath: targetFilename,
      },
    ],
  };
  expect(getFailedSnapshotTests(param)).toEqual([]);
});

test('handle missing testResults object', () => {
  const param = {
    numFailedTests: 1,
  };
  expect(getFailedSnapshotTests(param)).toEqual([]);
});

test('return empty if not failed tests', () => {
  const param = {
    numFailedTests: 0,
  };
  expect(getFailedSnapshotTests(param)).toEqual([]);
});

test('return empty if not failed snapshot tests', () => {
  const targetFilename = 'somewhere.js';
  const param = {
    numFailedTests: 0,
    testResults: [
      {
        snapshot: {
          unmatched: 0,
        },
        testFilePath: targetFilename,
      },
    ],
  };
  expect(getFailedSnapshotTests(param)).toEqual([]);
});
