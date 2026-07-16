/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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

const getTestsMock = () => [getTestMock(), getTestMock()];

test.each`
  tests                       | timings        | detectOpenHandles | runInBand | maxWorkers   | watch    | workerIdleMemoryLimit | expectedResult
  ${[getTestMock()]}          | ${[500, 500]}  | ${false}          | ${false}  | ${undefined} | ${true}  | ${undefined}          | ${false}
  ${getTestsMock()}           | ${[2000, 500]} | ${false}          | ${false}  | ${1}         | ${true}  | ${undefined}          | ${false}
  ${getTestsMock()}           | ${[2000, 500]} | ${false}          | ${false}  | ${2}         | ${true}  | ${undefined}          | ${false}
  ${getTestsMock()}           | ${[2000, 500]} | ${false}          | ${true}   | ${1}         | ${true}  | ${undefined}          | ${true}
  ${[getTestMock()]}          | ${[2000, 500]} | ${false}          | ${false}  | ${undefined} | ${true}  | ${undefined}          | ${false}
  ${getTestMock()}            | ${[500, 500]}  | ${false}          | ${false}  | ${undefined} | ${true}  | ${undefined}          | ${false}
  ${getTestsMock()}           | ${[2000, 500]} | ${false}          | ${false}  | ${1}         | ${false} | ${undefined}          | ${true}
  ${getTestMock()}            | ${[2000, 500]} | ${false}          | ${false}  | ${2}         | ${false} | ${undefined}          | ${false}
  ${[getTestMock()]}          | ${[2000]}      | ${false}          | ${false}  | ${undefined} | ${false} | ${undefined}          | ${true}
  ${getTestsMock()}           | ${[500, 500]}  | ${false}          | ${false}  | ${undefined} | ${false} | ${undefined}          | ${true}
  ${Array.from({length: 45})} | ${[500]}       | ${false}          | ${false}  | ${undefined} | ${false} | ${undefined}          | ${false}
  ${getTestsMock()}           | ${[2000, 500]} | ${false}          | ${false}  | ${undefined} | ${false} | ${undefined}          | ${false}
  ${getTestsMock()}           | ${[2000, 500]} | ${true}           | ${false}  | ${undefined} | ${false} | ${undefined}          | ${true}
  ${[getTestMock()]}          | ${[500, 500]}  | ${false}          | ${false}  | ${undefined} | ${true}  | ${'500MB'}            | ${false}
  ${getTestsMock()}           | ${[2000, 500]} | ${false}          | ${false}  | ${1}         | ${true}  | ${'500MB'}            | ${false}
  ${getTestsMock()}           | ${[2000, 500]} | ${false}          | ${false}  | ${1}         | ${false} | ${'500MB'}            | ${false}
  ${[getTestMock()]}          | ${[2000]}      | ${false}          | ${false}  | ${undefined} | ${false} | ${'500MB'}            | ${false}
  ${getTestsMock()}           | ${[500, 500]}  | ${false}          | ${false}  | ${undefined} | ${false} | ${'500MB'}            | ${false}
  ${getTestsMock()}           | ${[2000, 500]} | ${true}           | ${false}  | ${undefined} | ${false} | ${'500MB'}            | ${true}
`(
  'shouldRunInBand() - should return $expectedResult for runInBand mode',
  ({
    tests,
    timings,
    detectOpenHandles,
    maxWorkers,
    runInBand,
    watch,
    workerIdleMemoryLimit,
    expectedResult,
  }) => {
    expect(
      shouldRunInBand(tests, timings, {
        detectOpenHandles,
        maxWorkers,
        runInBand,
        watch,
        workerIdleMemoryLimit,
      }),
    ).toBe(expectedResult);
  },
);
