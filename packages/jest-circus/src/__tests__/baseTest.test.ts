/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {runTest} from '../__mocks__/testUtils';

test('simple test', () => {
  const {stdout} = runTest(`
    describe('describe', () => {
      beforeEach(() => {});
      afterEach(() => {});
      test('one', () => {});
      test('two', () => {});
    })
  `);

  expect(stdout).toMatchSnapshot();
});

test('function descriptors', () => {
  const {stdout} = runTest(`
    describe(function describer() {}, () => {
      test(class One {}, () => {});
    })
  `);

  expect(stdout).toMatchSnapshot();
});

test('failures', () => {
  const {stdout} = runTest(`
    describe('describe', () => {
      beforeEach(() => {});
      afterEach(() => { throw new Error('banana')});
      test('one', () => { throw new Error('kentucky')});
      test('two', () => {});
    })
  `);

  expect(stdout).toMatchSnapshot();
});

test('concurrent', () => {
  const {stdout} = runTest(`
    describe('describe', () => {
      beforeEach(() => {});
      afterEach(() => { throw new Error('banana')});
      test.concurrent('one', () => {
        console.log('hello one');
        throw new Error('kentucky')
      });
      test.concurrent('two', () => {
        console.log('hello two');
      });
      test.concurrent('three', async () => {
        console.log('hello three');
        await Promise.resolve();
      });
    })
  `);

  expect(stdout).toMatchSnapshot();
});

test('concurrent.each', () => {
  const {stdout} = runTest(`
    describe('describe', () => {
      beforeEach(() => {});
      afterEach(() => { throw new Error('banana')});
      test.concurrent.each([
        ['one'],
        ['two'],
        ['three'],
      ])('%s', async (name) => {
        console.log('hello %s', name);
        await Promise.resolve();
      });
    })
  `);

  expect(stdout).toMatchSnapshot();
});

test('describe.skip + concurrent', () => {
  const {stdout} = runTest(`
    describe.skip('describe', () => {
      beforeEach(() => {});
      afterEach(() => { throw new Error('banana')});
      test.concurrent('one', () => {
        console.log('hello one');
        throw new Error('kentucky')
      });
      test.concurrent('two', () => {
        console.log('hello two');
      });
      test.concurrent('three', async () => {
        console.log('hello three');
        await Promise.resolve();
      });
    })
  `);

  expect(stdout).not.toEqual(expect.stringContaining('hello'));

  expect(stdout).toMatchSnapshot();
});

test('describe.skip + concurrent.each', () => {
  const {stdout} = runTest(`
    describe.skip('describe', () => {
      beforeEach(() => {});
      afterEach(() => { throw new Error('banana')});
      test.concurrent.each([
        ['one'],
        ['two'],
        ['three'],
      ])('%s', async (name) => {
        console.log('hello %s', name);
        await Promise.resolve();
      });
    })
  `);

  expect(stdout).not.toEqual(expect.stringContaining('hello'));

  expect(stdout).toMatchSnapshot();
});

test('nested describe.skip + concurrent', () => {
  const {stdout} = runTest(`
    describe('describe', () => {
      describe.skip('nested', () => {
        test.concurrent('one', () => {
          console.log('hello one');
          throw new Error('kentucky')
        });
        test.concurrent('two', () => {
          console.log('hello two');
        });
        test.concurrent('three', async () => {
          console.log('hello three');
          await Promise.resolve();
        });
      })
    })
  `);

  expect(stdout).not.toEqual(expect.stringContaining('hello'));

  expect(stdout).toMatchSnapshot();
});

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
