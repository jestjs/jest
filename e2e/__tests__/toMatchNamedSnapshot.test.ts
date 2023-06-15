/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {cleanup, makeTemplate, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../to-match-named-snapshot');
const TESTS_DIR = path.resolve(DIR, '__tests__');

beforeEach(() => cleanup(TESTS_DIR));
afterAll(() => cleanup(TESTS_DIR));

test('basic support', () => {
  const filename = 'basic-support.test.js';
  const template = makeTemplate(
    "test('named snapshots', () => expect($1).toMatchNamedSnapshot('basic-support'));",
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
    expect(stderr).toMatch('Snapshot name: `named snapshots 1`');
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
        expect($2).toMatchNamedSnapshot('error-thrown-before-snapshot-$3');
      });`);

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['true', '{a: "original"}', '1']),
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
      [filename]: template(['false', '{a: "original"}', '2']),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).not.toMatch('1 obsolete snapshot found');
    expect(exitCode).toBe(1);
  }
});

test('first snapshot fails, second passes', () => {
  const filename = 'first-snapshot-fails-second-passes.test.js';
  const template = makeTemplate(`test('named snapshots', () => {
        expect($1).toMatchNamedSnapshot('test-snapshot');
        expect($2).toMatchNamedSnapshot('test-snapshot-2');
      });`);

  {
    writeFiles(TESTS_DIR, {[filename]: template(["'apple'", "'banana'", '1'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('2 snapshots written from 1 test suite.');
    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {[filename]: template(["'kiwi'", "'banana'", '2'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Snapshot name: `named snapshots 1`');
    // Match lines separately because empty line has been replaced with space:
    expect(stderr).toMatch('Snapshot: "apple"');
    expect(stderr).toMatch('Received: "kiwi"');
    expect(stderr).not.toMatch('1 obsolete snapshot found');
    expect(exitCode).toBe(1);
  }
});

test('does not mark snapshots as obsolete in skipped tests if snapshot name match test name', () => {
  const filename = 'no-obsolete-if-skipped.test.js';
  const template = makeTemplate(`test('snapshots', () => {
        expect(true).toBe(true);
      });

      $1('will be skipped', () => {
        expect({a: 6}).toMatchNamedSnapshot('will be skipped');
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
    console.log(stderr);
    expect(stderr).not.toMatch('1 obsolete snapshot found');
    expect(exitCode).toBe(0);
  }
});

test('mark snapshots as obsolete in skipped tests if snapshot name does not match test name', () => {
  const filename = 'no-obsolete-if-skipped.test.js';
  const template = makeTemplate(`test('snapshots', () => {
        expect(true).toBe(true);
      });

      $1('will be skipped', () => {
        expect({a: 6}).toMatchNamedSnapshot('will be obsolete');
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
    console.log(stderr);
    expect(stderr).toMatch('1 snapshot obsolete');
    expect(exitCode).toBe(1);
  }
});

test('throws the error if snapshot name is not string', () => {
  const filename = 'no-obsolete-if-skipped.test.js';
  const template = makeTemplate(`
      test('will be error', () => {
        expect({a: 6}).toMatchNamedSnapshot(true);
      });
      `);

  {
    writeFiles(TESTS_DIR, {[filename]: template(['test.skip'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    console.log(stderr);
    expect(stderr).toMatch('Expected snapshotName must be a string');
    expect(exitCode).toBe(1);
  }
});

test('accepts custom snapshot name', () => {
  const filename = 'accept-custom-snapshot-name.test.js';
  const template = makeTemplate(`test('accepts custom snapshot name', () => {
        expect(true).toMatchNamedSnapshot('custom-name');
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
        expect({createdAt: $1}).toMatchNamedSnapshot('property-matchers',{createdAt: expect.any(Date)});
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
  const filename = 'handle-invalid-property-matchers.test.js';
  {
    writeFiles(TESTS_DIR, {
      [filename]: `test('invalid property matchers', () => {
          expect({foo: 'bar'}).toMatchNamedSnapshot('null-property-matcher', null);
        });
      `,
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('Expected properties must be an object');
    expect(exitCode).toBe(1);
  }
});

test('handles undefined property matchers', () => {
  const filename = 'handle-undefined-property-matchers.test.js';
  {
    writeFiles(TESTS_DIR, {
      [filename]: `test('invalid property matchers', () => {
          expect({foo: 'bar'}).toMatchNamedSnapshot('undefined-property-matcher', undefined);
        });
      `,
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch('1 snapshot written');
    expect(exitCode).toBe(0);
  }
});

test('handles property matchers with deep properties', () => {
  const filename = 'handle-property-matchers-with-name.test.js';
  const template =
    makeTemplate(`test('handles property matchers with deep properties', () => {
        expect({ user: { createdAt: $1, name: $2 }}).toMatchNamedSnapshot('deep-property-matchers', { user: { createdAt: expect.any(Date), name: $2 }});
      });
      `);

  {
    writeFiles(TESTS_DIR, {
      [filename]: template(['new Date()', '"Jest"']),
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
    writeFiles(TESTS_DIR, {
      [filename]: template(['new Date()', '"CHANGED"']),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    expect(stderr).toMatch(
      'Snapshot name: `handles property matchers with deep properties 1`',
    );
    expect(stderr).toMatch('Snapshots:   1 failed, 1 total');
    expect(exitCode).toBe(1);
  }
});

test('error duplicate snapshot name', () => {
  const filename = 'duplicate-match-named-snapshot.test.js';
  const template = makeTemplate(
    `test('duplicate named snapshots', () => {
          expect($1).toMatchNamedSnapshot('basic-support');
          expect($1).toMatchNamedSnapshot('basic-support');
        });
    `,
  );
  {
    writeFiles(TESTS_DIR, {[filename]: template(['test'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    console.log(stderr);

    expect(stderr).toMatch(
      'The specific snapshot name was duplicate with the other snapshot.',
    );
    expect(stderr).toMatch('Snapshot name: basic-support');
    expect(exitCode).toBe(1);
  }
});

test('support concurrent testing', () => {
  const filename = 'match-snapshot-when-test-concurrent.test.js';
  const template = makeTemplate(`describe('group 1', () => {
        $1('concurrent 1', async () => {
          expect('concurrent 1-1').toMatchNamedSnapshot('test1');
          $2
        });

        $1('concurrent 2', async () => {
          expect('concurrent 1-2').toMatchNamedSnapshot('test2');
          $2
        });
      });

      describe('group 2', () => {
        $1('concurrent 1', async () => {
          expect('concurrent 2-1').toMatchNamedSnapshot('test3');
          $2
        });

        $1('concurrent 2', async () => {
          expect('concurrent 2-2').toMatchNamedSnapshot('test4');
          $2
        });
      });
      `);
  {
    writeFiles(TESTS_DIR, {[filename]: template(['test'])});
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    console.log(stderr);

    expect(exitCode).toBe(0);
  }

  {
    writeFiles(TESTS_DIR, {
      [filename]: template([
        'test.concurrent',
        'await new Promise(resolve => setTimeout(resolve, 5000));',
      ]),
    });
    const {stderr, exitCode} = runJest(DIR, ['-w=1', '--ci=false', filename]);
    console.log(stderr);

    expect(exitCode).toBe(0);
  }
});
