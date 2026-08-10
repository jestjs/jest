/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import fs from 'graceful-fs';
import WatchmanWatcher from '../WatchmanWatcher';

jest.mock('node:os', () => ({
  ...jest.requireActual('node:os'),
  platform: jest.fn(() => 'win32'),
}));
jest.mock('graceful-fs', () => ({
  ...jest.requireActual('graceful-fs'),
  lstat: jest.fn(),
}));

const ROOT = path.resolve('/root');
const mockLstat = jest.mocked(fs.lstat);

function makeWatcher() {
  const watcher = Object.create(WatchmanWatcher.prototype);
  Object.assign(watcher, {
    capabilities: {relative_root: false, wildmatch: false},
    doIgnore: () => false,
    dot: true,
    globs: [],
    hasIgnore: false,
    root: ROOT,
  });
  return watcher;
}

describe('WatchmanWatcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ignores EPERM when an outside process makes a file unreadable on Windows', () => {
    mockLstat.mockImplementation((_path, callback) => {
      callback(Object.assign(new Error('EPERM'), {code: 'EPERM'}), null);
    });

    const watcher = makeWatcher();
    const onError = jest.fn();
    watcher.on('error', onError);

    watcher.handleFileChange({exists: true, name: 'file.js', new: true});

    expect(onError).not.toHaveBeenCalled();
  });
});
