/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {execFile} from 'node:child_process';
import isWatchmanInstalled from '../isWatchmanInstalled';

jest.mock('node:child_process');

const mockExecFile = jest.mocked(execFile);

describe('isWatchmanInstalled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes watchman --version and returns true on success', async () => {
    mockExecFile.mockImplementation(((
      _file: string,
      _args: Array<string>,
      cb: (err: null, result: {stdout: string}) => void,
    ) => {
      cb(null, {stdout: 'v123'});
    }) as unknown as typeof execFile);
    expect(await isWatchmanInstalled()).toBe(true);
    expect(mockExecFile).toHaveBeenCalledWith(
      'watchman',
      ['--version'],
      expect.any(Function),
    );
  });

  it('returns false when execFile fails', async () => {
    mockExecFile.mockImplementation(((
      _file: string,
      _args: Array<string>,
      cb: (err: Error) => void,
    ) => {
      cb(new Error());
    }) as unknown as typeof execFile);
    expect(await isWatchmanInstalled()).toBe(false);
    expect(mockExecFile).toHaveBeenCalled();
  });
});
