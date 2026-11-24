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

const DIR = path.resolve(__dirname, '../to-match-snapshot');
const TESTS_DIR = path.resolve(DIR, '__tests__');

beforeEach(() => cleanup(TESTS_DIR));
afterAll(() => cleanup(TESTS_DIR));

test('basic support', () => {
  const filename = 'basic-support.test.js';
  const template = makeTemplate(
    "test('snapshots', () => expect($1).toMatchSnapshot());",
  );

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['{apple: "original value"}']),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
  }

  {
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(stderr).not.toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['{apple: "updated value"}']),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshot name: `snapshots 1`');
    expect(exitCode).toBe(1);
  }

  {
    const {stderr, exitCode} = runJest(DIR, [
      '-w=1',
      '--ci=false',
      filename,
      '-u',
    ]);
    expect(stderr).toMatch('1 snapshot updated from 1 test suite.');
    expect(exitCode).toBe(0);
  }
});

test('error thrown before snapshot', () => {
  const filename = 'error-thrown-before-snapshot.test.js';
  const template = makeTemplate(`test('snapshots', () => {
      expect($1).toBeTruthy();
      expect($2).toMatchSnapshot();
    });`);

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['true', '{a: "original"}']),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
  }

  {
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['false', '{a: "original"}']),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).not.toMatch('1 obsolete snapshot found');
    expect(exitCode).toBe(1);
  }
});

test('first snapshot fails, second passes', () => {
  const filename = 'first-snapshot-fails-second-passes.test.js';
  const template = makeTemplate(`test('snapshots', () => {
      expect($1).toMatchSnapshot();
      expect($2).toMatchSnapshot();
    });`);

  {
    writeFiles(TESTS_DIR, {[filename]: template(["'apple'", "'banana'"])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('2 snapshots written from 1 test suite.');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {[filename]: template(["'kiwi'", "'banana'"])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshot name: `snapshots 1`');
    // Match lines separately because empty line has been replaced with space:
    expect(stderr).toMatch('Snapshot: "apple"');
    expect(stderr).toMatch('Received: "kiwi"');
    expect(stderr).not.toMatch('1 obsolete snapshot found');
    expect(exitCode).toBe(1);
  }
});

test('does not mark snapshots as obsolete in skipped tests', () => {
  const filename = 'no-obsolete-if-skipped.test.js';
  const template = makeTemplate(`test('snapshots', () => {
      expect(true).toBe(true);
    });

    $1('will be skipped', () => {
      expect({a: 6}).toMatchSnapshot();
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template(['test'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {[filename]: template(['test.skip'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).not.toMatch('1 obsolete snapshot found');
    expect(exitCode).toBe(0);
  }
});

test('does not mark hinted snapshots as obsolete in skipped tests', () => {
  const filename = 'no-obsolete-hinted-if-skipped.test.js';
  const template = makeTemplate(`$1('will be skipped', () => {
      expect({a: 6}).toMatchSnapshot('hint');
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template(['test'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {[filename]: template(['test.skip'])});
    const {stderr, exitCode} = runJest(DIR, [
      '-w=1',
      '--ci=false',
      '-u',
      filename,
    ]);
    expect(stderr).not.toMatch('removed');
    expect(exitCode).toBe(0);
    // `-u` deletes whatever obsolete detection missed, so the key surviving is
    // the proof the hint did not hide it from its own test.
    const snapshot = fs.readFileSync(
      path.join(TESTS_DIR, '__snapshots__', `${filename}.snap`),
      'utf8',
    );
    expect(snapshot).toContain('exports[`will be skipped: hint 1`]');
  }
});

test('does not mark hinted snapshots as obsolete in deselected tests', () => {
  const filename = 'no-obsolete-hinted-if-deselected.test.js';
  const template = makeTemplate(`test('renders the header', () => {
      expect('header markup').toMatchSnapshot('markup');
      expect({a: 1}).toMatchSnapshot('props');
    });

    test('renders the footer', () => {
      expect('footer markup').toMatchSnapshot();
    });
    `);

  writeFiles(TESTS_DIR, {[filename]: template()});
  expect(runJest(DIR, ['-w=1', '--ci=false', filename]).stderr).toMatch(
    '3 snapshots written from 1 test suite.',
  );

  // A test the name pattern skips over reports as pending, same as `test.skip`,
  // so its snapshots have to survive the update the matching test triggers.
  const {stderr, exitCode} = runJest(DIR, [
    '-w=1',
    '--ci=false',
    '-t',
    'footer',
    '-u',
    filename,
  ]);

  expect(stderr).not.toMatch('removed');
  expect(exitCode).toBe(0);
  const snapshot = fs.readFileSync(
    path.join(TESTS_DIR, '__snapshots__', `${filename}.snap`),
    'utf8',
  );
  expect(snapshot).toContain('exports[`renders the header: markup 1`]');
  expect(snapshot).toContain('exports[`renders the header: props 1`]');
});

test('does not mark hinted snapshots as obsolete in failing tests', () => {
  const filename = 'no-obsolete-hinted-if-failed.test.js';
  // The failure comes first, so the snapshot below is never reached on the
  // second run — an unreached snapshot is the only kind obsolete detection
  // has to decide about.
  const template = makeTemplate(`test('breaks early', () => {
      expect(true).toBe($1);
      expect({a: 6}).toMatchSnapshot('hint');
    });
    `);

  writeFiles(TESTS_DIR, {[filename]: template(['true'])});
  expect(runJest(DIR, ['-w=1', '--ci=false', filename]).stderr).toMatch(
    '1 snapshot written from 1 test suite.',
  );

  // Updating snapshots is the usual response to a failure, so the failing
  // test's own snapshots must not be swept up by the same run.
  writeFiles(TESTS_DIR, {[filename]: template(['false'])});
  const {stderr, exitCode} = runJest(DIR, [
    '-w=1',
    '--ci=false',
    '-u',
    filename,
  ]);

  expect(stderr).not.toMatch('removed');
  expect(exitCode).toBe(1);
  const snapshot = fs.readFileSync(
    path.join(TESTS_DIR, '__snapshots__', `${filename}.snap`),
    'utf8',
  );
  expect(snapshot).toContain('exports[`breaks early: hint 1`]');
});

// jasmine2 has no `test.failing` clause in its obsolete guard at all.
const testOnCircus = isJestJasmineRun() ? test.skip : test;

testOnCircus(
  'does not mark hinted snapshots as obsolete in passing `test.failing`',
  () => {
    const filename = 'no-obsolete-hinted-if-test-failing.test.js';
    const template = makeTemplate(`$1('throws as expected', () => {
      $2;
      expect({a: 6}).toMatchSnapshot('hint');
    });
    `);

    writeFiles(TESTS_DIR, {
      [filename]: template(['test', 'expect(true).toBe(true)']),
    });
    expect(runJest(DIR, ['-w=1', '--ci=false', filename]).stderr).toMatch(
      '1 snapshot written from 1 test suite.',
    );

    // A `test.failing` that throws reports as passed, and the snapshots it never
    // reached past the throw are kept on purpose.
    writeFiles(TESTS_DIR, {
      [filename]: template(['test.failing', "throw new Error('boom')"]),
    });
    const {stderr, exitCode} = runJest(DIR, [
      '-w=1',
      '--ci=false',
      '-u',
      filename,
    ]);

    expect(stderr).not.toMatch('removed');
    expect(exitCode).toBe(0);
    const snapshot = fs.readFileSync(
      path.join(TESTS_DIR, '__snapshots__', `${filename}.snap`),
      'utf8',
    );
    expect(snapshot).toContain('exports[`throws as expected: hint 1`]');
  },
);

test('accepts custom snapshot name', () => {
  const filename = 'accept-custom-snapshot-name.test.js';
  const template = makeTemplate(`test('accepts custom snapshot name', () => {
      expect(true).toMatchSnapshot('custom-name');
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template()});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
  }
});

test('handles property matchers', () => {
  const filename = 'handle-property-matchers.test.js';
  const template = makeTemplate(`test('handles property matchers', () => {
      expect({createdAt: $1}).toMatchSnapshot({createdAt: expect.any(Date)});
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template(['new Date()'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
  }

  {
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {[filename]: template(['"string"'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshot name: `handles property matchers 1`');
    expect(stderr).toMatch('Snapshots:   1 failed, 1 total');
    expect(exitCode).toBe(1);
  }
});

test('handles invalid property matchers', () => {
  const filename = 'handle-property-matchers.test.js';
  {
    writeFiles(TESTS_DIR, {
      [filename]: `test('invalid property matchers', () => {
        expect({foo: 'bar'}).toMatchSnapshot(null);
      });
    `,
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Expected properties must be an object');
    expect(exitCode).toBe(1);
  }
  {
    writeFiles(TESTS_DIR, {
      [filename]: `test('invalid property matchers', () => {
        expect({foo: 'bar'}).toMatchSnapshot(null, 'test-name');
      });
    `,
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Expected properties must be an object');
    expect(stderr).toMatch(
      "To provide a hint without properties: toMatchSnapshot('hint')",
    );
    expect(exitCode).toBe(1);
  }
  {
    writeFiles(TESTS_DIR, {
      [filename]: `test('invalid property matchers', () => {
        expect({foo: 'bar'}).toMatchSnapshot(undefined, 'test-name');
      });
    `,
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Expected properties must be an object');
    expect(stderr).toMatch(
      "To provide a hint without properties: toMatchSnapshot('hint')",
    );
    expect(exitCode).toBe(1);
  }
});

test('handles property matchers with hint', () => {
  const filename = 'handle-property-matchers-with-hint.test.js';
  const template =
    makeTemplate(`test('handles property matchers with hint', () => {
      expect({createdAt: $1}).toMatchSnapshot({createdAt: expect.any(Date)}, 'descriptive hint');
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template(['new Date()'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
  }

  {
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {[filename]: template(['"string"'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch(
      'Snapshot name: `handles property matchers with hint: descriptive hint 1`',
    );
    expect(stderr).toMatch('Expected properties');
    expect(stderr).toMatch('Snapshots:   1 failed, 1 total');
    expect(exitCode).toBe(1);
  }
});

test('handles property matchers with deep properties', () => {
  const filename = 'handle-property-matchers-with-name.test.js';
  const template =
    makeTemplate(`test('handles property matchers with deep properties', () => {
      expect({ user: { createdAt: $1, name: $2 }}).toMatchSnapshot({ user: { createdAt: expect.any(Date), name: $2 }});
    });
    `);

  {
    writeFiles(TESTS_DIR, {[filename]: template(['new Date()', '"Jest"'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written from 1 test suite.');
    expect(exitCode).toBe(0);
  }

  {
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshots:   1 passed, 1 total');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {[filename]: template(['"string"', '"Jest"'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch(
      'Snapshot name: `handles property matchers with deep properties 1`',
    );
    expect(stderr).toMatch('Expected properties');
    expect(stderr).toMatch('Snapshots:   1 failed, 1 total');
    expect(exitCode).toBe(1);
  }

  {
    writeFiles(TESTS_DIR, {[filename]: template(['new Date()', '"CHANGED"'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch(
      'Snapshot name: `handles property matchers with deep properties 1`',
    );
    expect(stderr).toMatch('Snapshots:   1 failed, 1 total');
    expect(exitCode).toBe(1);
  }
});
