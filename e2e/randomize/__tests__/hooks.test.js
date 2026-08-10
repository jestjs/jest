/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

beforeAll(() => {
  process.stdout.write('This is before all\n');
});

beforeEach(() => {
  process.stdout.write('This is before each\n');
});

afterEach(() => {
  process.stdout.write('This is after each\n');
});

afterAll(() => {
  process.stdout.write('This is after all\n');
});

it('test1', () => {
  process.stdout.write('test1\n');
});

it('test2', () => {
  process.stdout.write('test2\n');
});

it('test3', () => {
  process.stdout.write('test3\n');
});

describe('describe1', () => {
  it('test4', () => {
    process.stdout.write('test4\n');
  });

  it('test5', () => {
    process.stdout.write('test5\n');
  });

  it('test6', () => {
    process.stdout.write('test6\n');
  });
});

describe('describe2', () => {
  afterAll(() => {
    process.stdout.write('This is after all describe2\n');
  });

  it('test7', () => {
    process.stdout.write('test7\n');
  });

  it('test8', () => {
    process.stdout.write('test8\n');
  });

  it('test9', () => {
    process.stdout.write('test9\n');
  });
});

describe('describe3', () => {
  beforeEach(() => {
    process.stdout.write('This is before each describe3\n');
  });

  it('test10', () => {
    process.stdout.write('test10\n');
  });

  it('test11', () => {
    process.stdout.write('test11\n');
  });

  it('test12', () => {
    process.stdout.write('test12\n');
  });

  describe('describe4', () => {
    it('test13', () => {
      process.stdout.write('test13\n');
    });

    it('test14', () => {
      process.stdout.write('test14\n');
    });

    it('test15', () => {
      process.stdout.write('test15\n');
    });
  });
});
