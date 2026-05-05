/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {runTest} from '../__mocks__/testUtils';

test('{before,after}All + concurrent', () => {
  const {stdout} = runTest(`
    const {setTimeout} = require('timers/promises')

    beforeAll(async () => await setTimeout(100));
    afterAll(async () => await setTimeout(100));
    test.concurrent('one', () => {
      console.log('hello one');
      throw new Error('kentucky')
    });
  `);

  expect(stdout).toMatchSnapshot();
});

test('describe + {before,after}All + concurrent', () => {
  const {stdout} = runTest(`
    const {setTimeout} = require('timers/promises')

    describe('describe', () => {
      beforeAll(async () => await setTimeout(100));
      afterAll(async () => await setTimeout(100));
      test.concurrent('one', () => {
        throw new Error('kentucky')
      });
      test.concurrent('two', () => {
        throw new Error('kentucky')
      });
    })
  `);

  expect(stdout).toMatchSnapshot();
});

test('describe + {before,after}All + concurrent multiple times', () => {
  const {stdout} = runTest(`
    const {setTimeout} = require('timers/promises')

    describe('describe1', () => {
      beforeAll(async () => await setTimeout(100));
      afterAll(async () => await setTimeout(100));
      test.concurrent('one', () => {
        throw new Error('kentucky')
      });
      test.concurrent('two', () => {});
    })
    describe('describe2', () => {
      beforeAll(async () => await setTimeout(100));
      afterAll(async () => await setTimeout(100));
      test.concurrent('one', () => {
        throw new Error('kentucky')
      });
      test.concurrent('two', () => {});
    })
  `);

  expect(stdout).toMatchSnapshot();
});

test('describe + concurrent & non concurrent', () => {
  const {stdout} = runTest(`
    const {setTimeout} = require('timers/promises')

    describe('describe', () => {
      beforeAll(async () => await setTimeout(100));
      afterAll(async () => await setTimeout(100));

      test.concurrent('one', () => {});
      test.concurrent('two', () => {});

      test('three', () => {});

      test.concurrent('four', () => {});

      test('five', () => {});

      test.concurrent('six', () => {});
      test.concurrent('seven', () => {});
    })
  `);

  expect(stdout).toMatchSnapshot();
});

test('Execute concurrent as a single sequential unit in each describe', () => {
  const {stdout} = runTest(`
    describe('foo', () => {
      beforeAll(() => {});
      afterAll(() => {});
      test.concurrent('A', () => {});
      test.concurrent('B', () => {});
      test('C', () => {});
      describe('bar', () => {
        beforeAll(() => {});
        afterAll(() => {});
        test.concurrent('D', () => {});
        test.concurrent('E', () => {});
        test('F', () => {});
      });
      describe('qux', () => {
        beforeAll(() => {});
        afterAll(() => {});
        test.concurrent('G', () => {});
        test.concurrent('H', () => {});
        test('I', () => {});
      });
    });
  `);

  expect(stdout).toMatchSnapshot();
});
