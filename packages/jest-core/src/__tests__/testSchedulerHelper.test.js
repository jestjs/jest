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
  tests              | timings        | maxWorkers   | watch    | expectedResult
  ${[getTestMock()]} | ${[500, 500]}  | ${undefined} | ${true}  | ${true}
  ${getTestsMock()}  | ${[2000, 500]} | ${1}         | ${true}  | ${true}
  ${getTestsMock()}  | ${[2000, 500]} | ${2}         | ${true}  | ${false}
  ${[getTestMock()]} | ${[2000, 500]} | ${undefined} | ${true}  | ${false}
  ${getTestMock()}   | ${[500, 500]}  | ${undefined} | ${true}  | ${false}
  ${getTestsMock()}  | ${[2000, 500]} | ${1}         | ${false} | ${true}
  ${getTestMock()}   | ${[2000, 500]} | ${2}         | ${false} | ${false}
  ${[getTestMock()]} | ${[2000]}      | ${undefined} | ${false} | ${true}
  ${getTestsMock()}  | ${[500, 500]}  | ${undefined} | ${false} | ${true}
  ${new Array(45)}   | ${[500]}       | ${undefined} | ${false} | ${false}
  ${getTestsMock()}  | ${[2000, 500]} | ${undefined} | ${false} | ${false}
`(
  'shouldRunInBand() - should return $expectedResult for runInBand mode',
  ({tests, timings, maxWorkers, watch, expectedResult}) => {
    expect(shouldRunInBand(tests, timings, {maxWorkers, watch})).toBe(
      expectedResult,
    );
  },
);
