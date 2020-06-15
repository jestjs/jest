/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {tmpdir} from 'os';
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

  const {summary, rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(exitCode).toBe(0);
});

test('interleaved describe and test children order', () => {
  const filename = 'interleaved.test.js';
  const content = `
    let lastTest;
    test('above', () => {
      try {
        expect(lastTest).toBe(undefined);
      } finally {
        lastTest = 'above';
      }
    });
    describe('describe', () => {
      test('inside', () => {
        try {
          expect(lastTest).toBe('above');
        } finally {
          lastTest = 'inside';
        }
      });
    });
    test('below', () => {
      try {
        expect(lastTest).toBe('inside');
      } finally {
        lastTest = 'below';
      }
    });
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, exitCode} = runJest(DIR);

  const {summary, rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(exitCode).toBe(0);
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

  const {summary, rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(exitCode).toBe(0);
});

test('cannot have describe with no implementation', () => {
  const filename = 'onlyConstructs.test.js';
  const content = `
    describe('describe, no implementation');
  `;

  writeFiles(TEST_DIR, {[filename]: content});
  const {stderr, exitCode} = runJest(DIR);

  const rest = cleanStderr(stderr);
  const {summary} = extractSummary(stderr);

  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(exitCode).toBe(1);
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

  const {summary} = extractSummary(stderr);
  expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(exitCode).toBe(1);
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

  const {summary, rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(exitCode).toBe(0);
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

  const {summary, rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(exitCode).toBe(0);
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

  const {summary} = extractSummary(stderr);
  expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(exitCode).toBe(1);
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

  const {summary, rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(exitCode).toBe(0);
});
