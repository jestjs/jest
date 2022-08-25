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

const logWarnSpy = jest.spyOn(console, 'warn').mockReturnValue(undefined);

const getTestsMock = () => [getTestMock(), getTestMock()];

test.each`
  tests              | timings        | detectOpenHandles | maxWorkers   | watch    | workerIdleMemoryLimit | expectedResult
  ${[getTestMock()]} | ${[500, 500]}  | ${false}          | ${undefined} | ${true}  | ${undefined}          | ${true}
  ${getTestsMock()}  | ${[2000, 500]} | ${false}          | ${1}         | ${true}  | ${undefined}          | ${true}
  ${getTestsMock()}  | ${[2000, 500]} | ${false}          | ${2}         | ${true}  | ${undefined}          | ${false}
  ${[getTestMock()]} | ${[2000, 500]} | ${false}          | ${undefined} | ${true}  | ${undefined}          | ${false}
  ${getTestMock()}   | ${[500, 500]}  | ${false}          | ${undefined} | ${true}  | ${undefined}          | ${false}
  ${getTestsMock()}  | ${[2000, 500]} | ${false}          | ${1}         | ${false} | ${undefined}          | ${true}
  ${getTestMock()}   | ${[2000, 500]} | ${false}          | ${2}         | ${false} | ${undefined}          | ${false}
  ${[getTestMock()]} | ${[2000]}      | ${false}          | ${undefined} | ${false} | ${undefined}          | ${true}
  ${getTestsMock()}  | ${[500, 500]}  | ${false}          | ${undefined} | ${false} | ${undefined}          | ${true}
  ${new Array(45)}   | ${[500]}       | ${false}          | ${undefined} | ${false} | ${undefined}          | ${false}
  ${getTestsMock()}  | ${[2000, 500]} | ${false}          | ${undefined} | ${false} | ${undefined}          | ${false}
  ${getTestsMock()}  | ${[2000, 500]} | ${true}           | ${undefined} | ${false} | ${undefined}          | ${true}
  ${[getTestMock()]} | ${[500, 500]}  | ${false}          | ${undefined} | ${true}  | ${5000}               | ${false}
  ${getTestsMock()}  | ${[2000, 500]} | ${false}          | ${1}         | ${true}  | ${5000}               | ${false}
  ${getTestsMock()}  | ${[2000, 500]} | ${false}          | ${0}         | ${true}  | ${5000}               | ${false}
  ${[getTestMock()]} | ${[2000]}      | ${false}          | ${undefined} | ${false} | ${5000}               | ${false}
  ${getTestsMock()}  | ${[500, 500]}  | ${false}          | ${undefined} | ${false} | ${5000}               | ${false}
`(
  'shouldRunInBand() - should return $expectedResult for runInBand mode',
  ({
    tests,
    timings,
    detectOpenHandles,
    maxWorkers,
    watch,
    workerIdleMemoryLimit,
    expectedResult,
  }) => {
    expect(
      shouldRunInBand(tests, timings, {
        detectOpenHandles,
        maxWorkers,
        watch,
        workerIdleMemoryLimit,
      }),
    ).toBe(expectedResult);
  },
);

test('should log warn for incompatible flags', () => {
  expect(
    shouldRunInBand(getTestsMock(), [500], {
      detectOpenHandles: true,
      maxWorkers: 1,
      watch: true,
      workerIdleMemoryLimit: 5000,
    }),
  ).toBe(true);

  expect(logWarnSpy).toHaveBeenCalledTimes(1);
  expect(logWarnSpy).toHaveBeenCalledWith(
    'workerIdleMemoryLimit does not work in combination with detectOpenHandles',
  );
});
