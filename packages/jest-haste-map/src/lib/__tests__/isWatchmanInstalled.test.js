/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {execFile} from 'child_process';
import isWatchmanInstalled from '../isWatchmanInstalled';

jest.mock('child_process');

describe('isWatchmanInstalled', () => {
  beforeEach(() => jest.clearAllMocks());

  it('executes watchman --version and returns true on success', async () => {
    execFile.mockImplementation((file, args, cb) => {
      expect(file).toBe('watchman');
      expect(args).toStrictEqual(['--version']);
      cb(null, {stdout: 'v123'});
    });
    expect(await isWatchmanInstalled()).toBe(true);
    expect(execFile).toHaveBeenCalledWith(
      'watchman',
      ['--version'],
      expect.any(Function),
    );
  });

  it('returns false when execFile fails', async () => {
    execFile.mockImplementation((file, args, cb) => {
      cb(new Error());
    });
    expect(await isWatchmanInstalled()).toBe(false);
    expect(execFile).toHaveBeenCalled();
  });
});
