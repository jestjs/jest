/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

describe('normalizePathSep', () => {
  it('does nothing on posix', () => {
    jest.resetModules();
    jest.mock('path', () => require.requireActual('path').posix);
    const normalizePathSep = require('../normalize_path_sep');
    expect(normalizePathSep('foo/bar/baz.js')).toEqual('foo/bar/baz.js');
  });

  it('replace slashes on windows', () => {
    jest.resetModules();
    jest.mock('path', () => require.requireActual('path').win32);
    const normalizePathSep = require('../normalize_path_sep');
    expect(normalizePathSep('foo/bar/baz.js')).toEqual('foo\\bar\\baz.js');
  });
});
