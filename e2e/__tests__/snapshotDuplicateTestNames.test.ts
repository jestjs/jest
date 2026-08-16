/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {isJestJasmineRun} from '@jest/test-utils';
import {cleanup, makeTemplate, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../snapshot-duplicate-test-names');
const TESTS_DIR = path.resolve(DIR, '__tests__');

beforeEach(() => cleanup(TESTS_DIR));
afterAll(() => cleanup(TESTS_DIR));

// Only circus reorders tests, so only it can take the keys out of definition
// order. Both runners have to agree on the keys themselves.
const testOnCircus = isJestJasmineRun() ? test.skip : test;

const readSnapshot = (filename: string) =>
  fs.readFileSync(
    path.join(TESTS_DIR, '__snapshots__', `${filename}.snap`),
    'utf8',
  );

test('gives each test sharing a full name its own keys', () => {
  const filename = 'own-keys.test.js';
  const template = makeTemplate(`
    describe('suite', () => {
      test('same name', () => {
        expect('from the first test').toMatchSnapshot();
        expect('also from the first test').toMatchSnapshot();
      });
      test('same name', () => {
        expect('from the second test').toMatchSnapshot();
      });
    });
  `);

  writeFiles(TESTS_DIR, {[filename]: template()});
  const {exitCode, stderr} = runJest(DIR, ['-w=1', '--ci=false', filename]);

  expect(stderr).toMatch('3 snapshots written from 1 test suite.');
  expect(exitCode).toBe(0);

  const snapshot = readSnapshot(filename);
  expect(snapshot).toContain(
    'exports[`suite same name 1`] = `"from the first test"`;',
  );
  expect(snapshot).toContain(
    'exports[`suite same name 2`] = `"also from the first test"`;',
  );
  expect(snapshot).toContain(
    'exports[`suite same name 2.1`] = `"from the second test"`;',
  );
});

testOnCircus(
  'keeps the keys stable when --randomize reorders the tests',
  () => {
    const filename = 'randomize.test.js';
    const template = makeTemplate(`
    describe('suite', () => {
      test('same name', () => {
        expect('from the first test').toMatchSnapshot();
      });
      test('same name', () => {
        expect('from the second test').toMatchSnapshot();
      });
    });
  `);

    writeFiles(TESTS_DIR, {[filename]: template()});
    expect(
      runJest(DIR, ['-w=1', '--ci=false', '--randomize', '--seed=1', filename])
        .stderr,
    ).toMatch('2 snapshots written from 1 test suite.');

    // Every seed has to agree with what the first one recorded, whichever order
    // it picks. `--ci` keeps a mismatch a failure instead of a silent rewrite.
    for (const seed of ['2', '3', '4', '5']) {
      const {exitCode, stderr} = runJest(DIR, [
        '-w=1',
        '--ci',
        '--randomize',
        '--seed',
        seed,
        filename,
      ]);

      expect(stderr).toMatch('Snapshots:   2 passed, 2 total');
      expect(exitCode).toBe(0);
    }
  },
);

testOnCircus('keeps the keys stable when concurrent tests interleave', () => {
  const filename = 'concurrent.test.js';
  const template = makeTemplate(`
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    describe('suite', () => {
      test.concurrent('same name', async () => {
        await sleep($1);
        expect('from the first test').toMatchSnapshot();
      });
      test.concurrent('same name', async () => {
        await sleep($2);
        expect('from the second test').toMatchSnapshot();
      });
    });
  `);

  writeFiles(TESTS_DIR, {[filename]: template(['10', '200'])});
  expect(runJest(DIR, ['-w=1', '--ci=false', filename]).stderr).toMatch(
    '2 snapshots written from 1 test suite.',
  );

  // Swapping the delays finishes the tests in the opposite order.
  writeFiles(TESTS_DIR, {[filename]: template(['200', '10'])});
  const {exitCode, stderr} = runJest(DIR, ['-w=1', '--ci', filename]);

  expect(stderr).toMatch('Snapshots:   2 passed, 2 total');
  expect(exitCode).toBe(0);
});

test('reports one namesake obsolete without dropping the other', () => {
  const filename = 'obsolete-namesake.test.js';
  const template = makeTemplate(`
    describe('suite', () => {
      test('same name', () => {
        expect(true).toBe(true);
      });
      test.skip('same name', () => {
        expect('second').toMatchSnapshot();
      });
    });
  `);

  writeFiles(TESTS_DIR, {
    [filename]: template(),
    [`__snapshots__/${filename}.snap`]: `// Jest Snapshot v1, https://jestjs.io/docs/snapshot-testing

exports[\`suite same name 1\`] = \`"stale, nothing takes this any more"\`;

exports[\`suite same name 2.1\`] = \`"second"\`;
`,
  });

  // The first test claims no key and the skipped one claims only its own, so
  // the stale key has to survive as obsolete rather than be hidden by its
  // namesake.
  const {exitCode, stderr} = runJest(DIR, [
    '-w=1',
    '--ci=false',
    '-u',
    filename,
  ]);

  expect(stderr).toMatch('1 snapshot removed from 1 test suite.');
  expect(exitCode).toBe(0);

  const snapshot = readSnapshot(filename);
  expect(snapshot).toContain('exports[`suite same name 2.1`] = `"second"`;');
  expect(snapshot).not.toContain('stale');
});

test('reports the key it wrote when a namesake fails to match', () => {
  const filename = 'mismatch.test.js';
  const template = makeTemplate(`
    describe('suite', () => {
      test('same name', () => {
        expect('from the first test').toMatchSnapshot();
      });
      test('same name', () => {
        expect($1).toMatchSnapshot();
      });
    });
  `);

  writeFiles(TESTS_DIR, {[filename]: template(["'from the second test'"])});
  expect(runJest(DIR, ['-w=1', '--ci=false', filename]).stderr).toMatch(
    '2 snapshots written from 1 test suite.',
  );

  writeFiles(TESTS_DIR, {[filename]: template(["'changed'"])});
  const {exitCode, stderr} = runJest(DIR, ['-w=1', '--ci', filename]);

  expect(stderr).toMatch('Snapshot name: `suite same name 2.1`');
  expect(exitCode).toBe(1);
});

test('keeps a hint apart from a colon in a test name', () => {
  const filename = 'hint-vs-colon.test.js';
  const template = makeTemplate(`
    test('a: b', () => {
      expect('from the test named with a colon').toMatchSnapshot();
    });
    test('a', () => {
      expect('from the hinted test').toMatchSnapshot('b');
    });
  `);

  writeFiles(TESTS_DIR, {[filename]: template()});
  const {exitCode, stderr} = runJest(DIR, ['-w=1', '--ci=false', filename]);

  expect(stderr).toMatch('2 snapshots written from 1 test suite.');
  expect(exitCode).toBe(0);

  // Both would be `a: b 1` if the hint were joined onto the name with ': '.
  const snapshot = readSnapshot(filename);
  expect(snapshot).toContain(
    'exports[`a: b 1`] = `"from the test named with a colon"`;',
  );
  expect(snapshot).toContain('exports[`a › b 1`] = `"from the hinted test"`;');
});

test('reports a key left by a deleted test with a colon in its name', () => {
  const filename = 'deleted-colon-name.test.js';

  writeFiles(TESTS_DIR, {
    [filename]: "test.skip('a', () => {});\n",
    [`__snapshots__/${filename}.snap`]: `// Jest Snapshot v1, https://jestjs.io/docs/snapshot-testing

exports[\`a: b 1\`] = \`"left by a deleted test"\`;
`,
  });

  // `test('a')` is skipped, so it claims what it did not reach — but the key
  // belongs to a gone `test('a: b')`, not to a hint of its own.
  const {exitCode, stderr} = runJest(DIR, [
    '-w=1',
    '--ci=false',
    '-u',
    filename,
  ]);

  expect(stderr).toMatch('1 snapshot file removed from 1 test suite.');
  expect(exitCode).toBe(0);
});
