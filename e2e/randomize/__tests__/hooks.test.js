/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

beforeAll(() => {
  console.log('This is before all');
});

beforeEach(() => {
  console.log('This is before each');
});

afterEach(() => {
  console.log('This is after each');
});

afterAll(() => {
  console.log('This is after all');
});

it('test1', () => {
  console.log('test1');
});

it('test2', () => {
  console.log('test2');
});

it('test3', () => {
  console.log('test3');
});

describe('describe1', () => {
  it('test4', () => {
    console.log('test4');
  });

  it('test5', () => {
    console.log('test5');
  });

  it('test6', () => {
    console.log('test6');
  });
});

describe('describe2', () => {
  afterAll(() => {
    console.log('This is after all describe2');
  });

  it('test7', () => {
    console.log('test7');
  });

  it('test8', () => {
    console.log('test8');
  });

  it('test9', () => {
    console.log('test9');
  });
});

describe('describe3', () => {
  beforeEach(() => {
    console.log('This is before each describe3');
  });

  it('test10', () => {
    console.log('test10');
  });

  it('test11', () => {
    console.log('test11');
  });

  it('test12', () => {
    console.log('test12');
  });

  describe('describe4', () => {
    it('test13', () => {
      console.log('test13');
    });

    it('test14', () => {
      console.log('test14');
    });

    it('test15', () => {
      console.log('test15');
    });
  });
});
