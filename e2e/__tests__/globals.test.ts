/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {tmpdir} from 'os';
import {compileFunction} from 'vm';
import {wrap} from 'jest-snapshot-serializer-raw';
import runJest from '../runJest';
import {
  cleanup,
  createEmptyPackage,
  extractSummary,
  writeFiles,
} from '../Utils';

const DIR = path.resolve(tmpdir(), 'globalVariables.test');
const TEST_DIR = path.resolve(DIR, '__tests__');

function cleanStderr(stderr: string) {
  const {rest} = extractSummary(stderr);
  return rest.replace(/.*(jest-jasmine2).*\n/g, '');
}

beforeEach(() => {
  cleanup(DIR);
  createEmptyPackage(DIR);
});

afterAll(() => cleanup(DIR));

test('basic test constructs', () => {
  const filename = 'basic.testConstructs.test.js';
  const content = `
    it('it', () => {});
    test('test', () => {});

    describe('describe', () => {
      it('it', () => {});
      test('test', () => {});
    });
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, exitCode} = runJest(DIR);
  expect(exitCode).toBe(0);

  const {summary, rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
});

test('skips', () => {
  const filename = 'skipsConstructs.test.js';
  const content = `
    it('it', () => {});
    xtest('xtest', () => {});
    xit('xit', () => {});
    it.skip('it.skip', () => {});
    test.skip('test.skip', () => {});

    xdescribe('xdescribe', () => {
      it('it', () => {});
      test('test', () => {});
    });

    describe.skip('describe.skip', () => {
      test('test', () => {});
      describe('describe', () => {
        test('test', () => {});
      });
    });
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, exitCode} = runJest(DIR);

  const {summary, rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(exitCode).toBe(0);
});

test('only', () => {
  const filename = 'onlyConstructs.test.js';
  const content = `
    it('it', () => {});
    test.only('test.only', () => {});
    it.only('it.only', () => {});
    fit('fit', () => {});

    fdescribe('fdescribe', () => {
      it('it', () => {});
      test('test', () => {});
    });

    describe.only('describe.only', () => {
      test('test', () => {});
      describe('describe', () => {
        test('test', () => {});
      });
    });
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, exitCode} = runJest(DIR);
  expect(exitCode).toBe(0);

  const {summary, rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
});

test('cannot have describe with no implementation', () => {
  const filename = 'onlyConstructs.test.js';
  const content = `
    describe('describe, no implementation');
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, exitCode} = runJest(DIR);
  expect(exitCode).toBe(1);

  const rest = cleanStderr(stderr);
  const {summary} = extractSummary(stderr);

  const rightTrimmedRest = rest
    .split('\n')
    .map(l => l.trimRight())
    .join('\n')
    .trim();

  if (typeof compileFunction === 'function') {
    expect(rightTrimmedRest).toEqual(
      `
FAIL __tests__/onlyConstructs.test.js
  ● Test suite failed to run

    Missing second argument. It must be a callback function.

    > 1 | describe('describe, no implementation');
        | ^

      at Object.describe (__tests__/onlyConstructs.test.js:1:1)
    `.trim(),
    );
  } else {
    expect(rightTrimmedRest).toEqual(
      `
FAIL __tests__/onlyConstructs.test.js
  ● Test suite failed to run

    Missing second argument. It must be a callback function.

    > 1 | describe('describe, no implementation');
        |          ^

      at Object.<anonymous> (__tests__/onlyConstructs.test.js:1:10)
    `.trim(),
    );
  }
  expect(wrap(summary)).toMatchSnapshot();
});

test('cannot test with no implementation', () => {
  const filename = 'onlyConstructs.test.js';
  const content = `
    it('it', () => {});
    it('it, no implementation');
    test('test, no implementation');
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, exitCode} = runJest(DIR);
  expect(exitCode).toBe(1);

  const {summary} = extractSummary(stderr);
  expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
});

test('skips with expand arg', () => {
  const filename = 'skipsConstructs.test.js';
  const content = `
    it('it', () => {});
    xtest('xtest', () => {});
    xit('xit', () => {});
    it.skip('it.skip', () => {});
    test.skip('test.skip', () => {});

    xdescribe('xdescribe', () => {
      it('it', () => {});
      test('test', () => {});
    });

    describe.skip('describe.skip', () => {
      test('test', () => {});
      describe('describe', () => {
        test('test', () => {});
      });
    });
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, exitCode} = runJest(DIR, ['--expand']);
  expect(exitCode).toBe(0);

  const {summary, rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
});

test('only with expand arg', () => {
  const filename = 'onlyConstructs.test.js';
  const content = `
    it('it', () => {});
    test.only('test.only', () => {});
    it.only('it.only', () => {});
    fit('fit', () => {});

    fdescribe('fdescribe', () => {
      it('it', () => {});
      test('test', () => {});
    });

    describe.only('describe.only', () => {
      test('test', () => {});
      describe('describe', () => {
        test('test', () => {});
      });
    });
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, exitCode} = runJest(DIR, ['--expand']);
  expect(exitCode).toBe(0);

  const {summary, rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
});

test('cannot test with no implementation with expand arg', () => {
  const filename = 'onlyConstructs.test.js';
  const content = `
    it('it', () => {});
    it('it, no implementation');
    test('test, no implementation');
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, exitCode} = runJest(DIR, ['--expand']);
  expect(exitCode).toBe(1);

  const {summary} = extractSummary(stderr);
  expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
});

test('function as descriptor', () => {
  const filename = 'functionAsDescriptor.test.js';
  const content = `
    function Foo() {}
    describe(Foo, () => {
      it('it', () => {});
    });
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, exitCode} = runJest(DIR);
  expect(exitCode).toBe(0);

  const {summary, rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
});
