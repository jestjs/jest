/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

import {shouldRunInBand} from '../testSchedulerHelper';

const getTestMock = () => ({
  context: {
    config: {
      runner: 'jest-runner-parallel',
    },
    hasteFS: {
      matchFiles: jest.fn(() => []),
    },
  },
  path: './test/path.js',
});

const inBandProjectMock = () => ({...getTestMock(), runInBand: true});
const getTestsMock = () => [getTestMock(), getTestMock()];
const lotsOfTests = () => new Array(45).fill(1).map(getTestMock);

test.each`
   tests                    | timings         | detectOpenHandles | maxWorkers   | globalRunInBand | watch    | expectedResult
  ${[getTestMock()]}       | ${[500, 500]}   | ${false}          | ${undefined} | ${false}        | ${true}  | ${true}
  ${getTestsMock()}        | ${[2000, 500]}  | ${false}          | ${1}         | ${false}        | ${true}  | ${true}
  ${getTestsMock()}        | ${[2000, 500]}  | ${false}          | ${2}         | ${false}        | ${true}  | ${false}
  ${[getTestMock()]}       | ${[2000, 500]}  | ${false}          | ${undefined} | ${false}        | ${true}  | ${false}
  ${getTestsMock()}        | ${[500, 500]}   | ${false}          | ${undefined} | ${false}        | ${true}  | ${false}
  ${getTestsMock()}        | ${[2000, 500]}  | ${false}          | ${1}         | ${false}        | ${false} | ${true}
  ${getTestsMock()}        | ${[2000, 500]}  | ${false}          | ${2}         | ${false}        | ${false} | ${false}
  ${[getTestMock()]}       | ${[2000]}       | ${false}          | ${undefined} | ${false}        | ${false} | ${true}
  ${getTestsMock()}        | ${[500, 500]}   | ${false}          | ${undefined} | ${false}        | ${false} | ${true}
  ${lotsOfTests()}         | ${[500]}        | ${false}          | ${undefined} | ${false}        | ${false} | ${false}
  ${getTestsMock()}        | ${[2000, 500]}  | ${false}          | ${undefined} | ${false}        | ${false} | ${false}
  ${getTestsMock()}        | ${[2000, 500]}  | ${true}           | ${undefined} | ${false}        | ${false} | ${true}
  ${[inBandProjectMock()]} | ${[1000, 1000]} | ${false}          | ${undefined} | ${false}        | ${false} | ${true}
  ${getTestsMock()}        | ${[1000, 1000]} | ${false}          | ${undefined} | ${true}         | ${false} | ${true}
`(
  'shouldRunInBand() - should return $expectedResult for runInBand mode',
  ({
     tests,
     timings,
     detectOpenHandles,
     maxWorkers,
     watch,
     expectedResult,
     globalRunInBand,
   }) => {
    expect(
      shouldRunInBand(tests, timings, {
        detectOpenHandles,
        maxWorkers,
        runInBand: globalRunInBand,
        watch,
      }),
    ).toBe(expectedResult);
  },
);
