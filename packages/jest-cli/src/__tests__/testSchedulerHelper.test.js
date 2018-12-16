/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

import {computeRunInBand} from '../testSchedulerHelper';

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

describe('computeRunInBand()', () => {
  describe('watch mode enabled', () => {
    test('fast tests and only one test', () => {
      expect(
        computeRunInBand([getTestMock()], true, undefined, [500, 500]),
      ).toBeTruthy();
    });

    // This apply also when runInBand arg present
    // https://github.com/facebook/jest/blob/700e0dadb85f5dc8ff5dac6c7e98956690049734/packages/jest-config/src/getMaxWorkers.js#L14-L17
    test('one worker only', () => {
      expect(
        computeRunInBand(getTestsMock(), true, 1, [2000, 500]),
      ).toBeTruthy();
    });

    test('slow tests', () => {
      expect(
        computeRunInBand([getTestMock()], true, undefined, [2000, 500]),
      ).toBeFalsy();
    });

    test('more than one test', () => {
      expect(
        computeRunInBand(getTestsMock(), true, undefined, [500, 500]),
      ).toBeFalsy();
    });
  });

  describe('watch mode disabled', () => {
    test('one worker only', () => {
      expect(
        computeRunInBand(getTestsMock(), false, 1, [2000, 500]),
      ).toBeTruthy();
    });

    test('one test only', () => {
      expect(
        computeRunInBand([getTestMock()], false, undefined, [2000]),
      ).toBeTruthy();
    });

    test('fast tests and less than 20', () => {
      expect(
        computeRunInBand([getTestMock()], false, undefined, [2000]),
      ).toBeTruthy();
    });

    test('slow tests', () => {
      expect(
        computeRunInBand(getTestsMock(), false, undefined, [2000]),
      ).toBeFalsy();
    });

    test('too much tests more than 20', () => {
      const tests = new Array(45);
      expect(computeRunInBand(tests, false, undefined, [500])).toBeFalsy();
    });
  });
});
