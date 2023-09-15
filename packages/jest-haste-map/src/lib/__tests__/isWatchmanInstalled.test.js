/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {execFile} from 'child_process';
import {promisify} from 'util';
import isWatchmanInstalled from '../isWatchmanInstalled';

jest.mock('child_process');

describe('isWatchmanInstalled', () => {
  beforeEach(() => jest.clearAllMocks());

  const promisifiedExec = jest.mocked(promisify(execFile));

  it('executes watchman --version and returns true on success', async () => {
    promisifiedExec.mockImplementation((file, args) => {
      expect(file).toBe('watchman');
      expect(args).toStrictEqual(['--version']);
      return {stdout: 'v123'};
    });
    expect(await isWatchmanInstalled()).toBe(true);
    expect(promisifiedExec).toHaveBeenCalledWith('watchman', ['--version']);
  });

  it('returns false when execFile fails', async () => {
    promisifiedExec.mockRejectedValue(new Error());
    expect(await isWatchmanInstalled()).toBe(false);
    expect(promisifiedExec).toHaveBeenCalled();
  });
});
