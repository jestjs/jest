/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

let allTestsCount = 0;
let allSuitesCount = 0;
const delay = 1;

const createTestAsync = (name, passing) => done => {
  const fullName = `${name} > async,${passing ? 'passing' : 'failing'}`;
  setTimeout(() => {
    test(fullName, () => {
      console.log(fullName);
      expect(true).toBe(passing);
    });
    done();
  }, delay);

  allTestsCount++;
};

const createTestSync = (name, passing) => () => {
  const fullName = `${name} > sync:${passing ? 'passing' : 'failing'}`;
  test(fullName, () => {
    console.log(fullName);
    expect(true).toBe(passing);
  });

  allTestsCount++;
};

const createTestWithDescribeSync = (name, createTest) => () => {
  describe(`${name} > describeSync (testCreatingSuite)`, () =>
    createTestSet(`${name} > describeSync`, createTest));

  allSuitesCount++;
};
const createTestWithDescribeAsync = (name, createTest) => done => {
  setTimeout(() => {
    describe(`${name} > describeAsync (testCreatingSuite)`, () =>
      createTestSet(`${name} > describeAsync`, createTest));
    done();
  }, delay);

  allSuitesCount++;
};

const createTestSet = (name, createTest, withSuite = []) => {
  beforeAll(createTest(`${name} > beforeAll`, true));
  beforeAll(createTest(`${name} > beforeAll`, false));
  test(
    `${name} > test1 (testCreatingTest)`,
    createTest(`${name} > test1`, true)
  );
  allTestsCount++;
  test(
    `${name} > test2 (testCreatingTest)`,
    createTest(`${name} > test2`, false)
  );
  allTestsCount++;

  if (withSuite.includes('sync')) {
    beforeAll(createTestWithDescribeSync('beforeAll', createTest));
    test(
      `${name} > describeSync (testCreatingTest)`,
      createTestWithDescribeSync(name, createTest)
    );
    allTestsCount++;
  }

  if (withSuite.includes('async')) {
    beforeAll(createTestWithDescribeAsync('beforeAll', createTest));
    test(
      `${name} > describeAsync (testCreatingTest)`,
      createTestWithDescribeAsync(name, createTest)
    );
    allTestsCount++;
  }

  afterAll(() => {
    console.log(`${name} > afterAll`);
  });
};

describe('master', () => {
  describe(`a:sync`, () => {
    createTestSet('a:sync', createTestSync);
  });
  describe(`b:async`, () => {
    createTestSet('b:async', createTestAsync);
  });
  describe(`c:both`, () => {
    createTestSet('c:both:sync', createTestSync);
    createTestSet('c:both:async', createTestAsync);
  });
  describe(`d:withNested:sync`, () => {
    createTestSet('d:withNested:sync', createTestSync, ['async', 'sync']);
  });
  describe(`e:withNested:async`, () => {
    createTestSet('e:withNested:async', createTestAsync, ['async', 'sync']);
  });
  describe(`f:withNested:both`, () => {
    createTestSet('f:withNested:both:sync', createTestSync, ['async', 'sync']);
    createTestSet('f:withNested:both:async', createTestAsync, [
      'async',
      'sync',
    ]);
  });
  afterAll(() => {
    console.log({
      allSuitesCount,
      allTestsCount,
    });
  });
});
