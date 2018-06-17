/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const runJest = require('../runJest');
const ConditionalTest = require('../../scripts/ConditionalTest');

describe(`default run, with no '--testLocationInResults' flag`, () => {
  let result;
  let assertions;

  beforeAll(() => {
    result = runJest.json('location-in-results').json;
    assertions = result.testResults[0].assertionResults;
  });

  it('result should success', () => {
    expect(result.success).toBe(true);
  });

  it('result should have 6 total tests', () => {
    expect(result.numTotalTests).toBe(6);
  });

  describe('assertion at index', () => {
    describe('0', () => {
      it('should have property location equal to null', () => {
        expect(assertions[0]).toHaveProperty('location', null);
      });
    });

    describe('1', () => {
      it('should have property location equal to null', () => {
        expect(assertions[1]).toHaveProperty('location', null);
      });
    });

    describe('2', () => {
      it('should have property location equal to null', () => {
        expect(assertions[2]).toHaveProperty('location', null);
      });
    });

    describe('3', () => {
      it('should have property location equal to null', () => {
        expect(assertions[3]).toHaveProperty('location', null);
      });
    });

    describe('4', () => {
      it('should have property location equal to null', () => {
        expect(assertions[4]).toHaveProperty('location', null);
      });
    });

    describe('5', () => {
      it('should have property location equal to null', () => {
        expect(assertions[5]).toHaveProperty('location', null);
      });
    });
  });
});

it('adds correct location info when provided with flag', () => {
  const result = runJest.json('location-in-results', [
    '--testLocationInResults',
  ]).json;

  const assertions = result.testResults[0].assertionResults;
  expect(result.success).toBe(true);
  expect(result.numTotalTests).toBe(6);
  expect(assertions[0].location).toEqual({
    column: 1,
    line: 12,
  });

  expect(assertions[1].location).toEqual({
    column: 1,
    line: 16,
  });

  expect(assertions[2].location).toEqual({
    column: 1,
    line: 20,
  });

  // Technically the column should be 3, but callsites is not correct.
  // jest-circus uses stack-utils + asyncErrors which resolves this.
  expect(assertions[3].location).toEqual({
    column: ConditionalTest.isJestCircusRun() ? 3 : 2,
    line: 25,
  });

  expect(assertions[4].location).toEqual({
    column: ConditionalTest.isJestCircusRun() ? 3 : 2,
    line: 29,
  });

  expect(assertions[5].location).toEqual({
    column: ConditionalTest.isJestCircusRun() ? 3 : 2,
    line: 33,
  });
});

// ci is failing somehow

// describe(`run, with '--testLocationInResults' flag`, () => {
//   let result;
//   let assertions;

//   beforeAll(() => {
//     result = runJest.json('location-in-results', ['--testLocationInResults'])
//       .json;
//     assertions = result.testResults[0].assertionResults;
//   });

//   it('result should success', () => {
//     expect(result.success).toBe(true);
//   });

//   it('result should have 6 total tests', () => {
//     expect(result.numTotalTests).toBe(6);
//   });

//   describe('assertion at index', () => {
//     describe('0', () => {
//       it('should have property location equal to { column: 1, line: 10 }', () => {
//         expect(assertions[0]).toHaveProperty(
//           'location',
//           expect.objectContaining({
//             column: 1,
//             line: 12,
//           }),
//         );
//       });
//     });

//     describe('1', () => {
//       it('should have property location equal to { column: 1, line: 14 }', () => {
//         expect(assertions[1]).toHaveProperty(
//           'location',
//           expect.objectContaining({
//             column: 1,
//             line: 16,
//           }),
//         );
//       });
//     });

//     describe('2', () => {
//       it('should have property location equal to { column: 1, line: 18 }', () => {
//         expect(assertions[2]).toHaveProperty(
//           'location',
//           expect.objectContaining({
//             column: 1,
//             line: 20,
//           }),
//         );
//       });
//     });

//     describe('3', () => {
//       it('should have property location equal to { column: 3, line: 23 }', () => {
//         expect(assertions[3]).toHaveProperty(
//           'location',
//           expect.objectContaining({
//             column: ConditionalTest.isJestCircusRun() ? 3 : 2,
//             line: 25,
//           }),
//         );
//       });
//     });

//     describe('4', () => {
//       it('should have property location equal to { column: 3, line: 27 }', () => {
//         expect(assertions[4]).toHaveProperty(
//           'location',
//           expect.objectContaining({
//             column: ConditionalTest.isJestCircusRun() ? 3 : 2,
//             line: 29,
//           }),
//         );
//       });
//     });

//     describe('5', () => {
//       it('should have property location equal to { column: 3, line: 31 }', () => {
//         expect(assertions[5]).toHaveProperty(
//           'location',
//           expect.objectContaining({
//             column: ConditionalTest.isJestCircusRun() ? 3 : 2,
//             line: 33,
//           }),
//         );
//       });
//     });
//   });
// });
