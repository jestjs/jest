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

const getTestsMock = () => [getTestMock(), getTestMock()];

test.each`
  tests              | timings        | detectOpenHandles | maxWorkers   | watch    | forceWorkers | expectedResult
  ${[getTestMock()]} | ${[500, 500]}  | ${false}          | ${undefined} | ${true}  | ${false}     | ${true}
  ${getTestsMock()}  | ${[2000, 500]} | ${false}          | ${1}         | ${true}  | ${false}     | ${true}
  ${getTestsMock()}  | ${[2000, 500]} | ${false}          | ${2}         | ${true}  | ${false}     | ${false}
  ${[getTestMock()]} | ${[2000, 500]} | ${false}          | ${undefined} | ${true}  | ${false}     | ${false}
  ${getTestMock()}   | ${[500, 500]}  | ${false}          | ${undefined} | ${true}  | ${false}     | ${false}
  ${getTestsMock()}  | ${[2000, 500]} | ${false}          | ${1}         | ${false} | ${false}     | ${true}
  ${getTestMock()}   | ${[2000, 500]} | ${false}          | ${2}         | ${false} | ${false}     | ${false}
  ${[getTestMock()]} | ${[2000]}      | ${false}          | ${undefined} | ${false} | ${false}     | ${true}
  ${getTestsMock()}  | ${[500, 500]}  | ${false}          | ${undefined} | ${false} | ${false}     | ${true}
  ${new Array(45)}   | ${[500]}       | ${false}          | ${undefined} | ${false} | ${false}     | ${false}
  ${getTestsMock()}  | ${[2000, 500]} | ${false}          | ${undefined} | ${false} | ${false}     | ${false}
  ${getTestsMock()}  | ${[2000, 500]} | ${true}           | ${undefined} | ${false} | ${false}     | ${true}
  ${[getTestMock()]} | ${[500, 500]}  | ${false}          | ${undefined} | ${true}  | ${true}      | ${false}
  ${getTestsMock()}  | ${[2000, 500]} | ${false}          | ${1}         | ${true}  | ${true}      | ${false}
`(
  'shouldRunInBand() - should return $expectedResult for runInBand mode',
  ({tests, timings, detectOpenHandles, maxWorkers, watch, forceWorkers, expectedResult}) => {
    expect(
      shouldRunInBand(tests, timings, {detectOpenHandles, maxWorkers, watch, forceWorkers}),
    ).toBe(expectedResult);
  },
);

test('should throw when forceWorkers & detectOpenHandles used together', () => {
  expect(() => shouldRunInBand(getTestMock(), [2000,2000], { detectOpenHandles: true, forceWorkers: true})).toThrowError();
})
