/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

jest.mock('wsl-path', () => ({
  wslToWindowsSync: path => 'resolved:' + path,
}));

import {readTestResults} from '../readTestResults';

const posixPath1 = '/mnt/c/Users/Path/PageTitle.test.tsx';
const posixPath2 = '/mnt/c/Users/Path2/PageFooter.test.tsx';

const resultFixture = JSON.stringify({
  coverageMap: {
    [posixPath1]: {path: posixPath1},
    [posixPath2]: {path: posixPath2},
  },
  testResults: [
    {
      assertionResults: [],
      name: posixPath1,
    },
    {
      assertionResults: [],
      name: posixPath2,
    },
  ],
});

describe('ResultReader', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should just parse the json result for non wsl environments', () => {
    const result = readTestResults(resultFixture, {useWsl: false});

    expect(result.testResults[0].name).toBe(posixPath1);
    expect(Object.keys(result.coverageMap)).toEqual([posixPath1, posixPath2]);
  });

  it('should replace the testResult paths with the resolved paths when wsl is defined', () => {
    const result = readTestResults(resultFixture, {useWsl: true});

    expect(result.testResults[0].name).toBe('resolved:' + posixPath1);
    expect(result.testResults[1].name).toBe('resolved:' + posixPath2);
  });

  it('should replace the coverageMap paths with the resolved paths when wsl is defined', () => {
    const result = readTestResults(resultFixture, {useWsl: true});

    const mapKey1 = Object.keys(result.coverageMap)[0];
    const mapKey2 = Object.keys(result.coverageMap)[1];

    expect(mapKey1).toBe('resolved:' + posixPath1);
    expect(mapKey2).toBe('resolved:' + posixPath2);
    expect(result.coverageMap[mapKey1].path).toBe('resolved:' + posixPath1);
    expect(result.coverageMap[mapKey2].path).toBe('resolved:' + posixPath2);
  });
});
