/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

jest.mock('fs');

describe('Runtime internal module registry', () => {
  it('behaves correctly when requiring a module that is used by jest internals', () => {
    const fs = require('fs');

    // We require from this crazy path so that we can mimick Jest (and it's
    // transitive deps) being installed along side a projects deps (e.g. with an
    // NPM3 flat dep tree)
    const jestUtil = require('../../../packages/jest-util');

    // If FS is mocked correctly, this folder won't actually be created on the
    // filesystem
    jestUtil.createDirectory('./dont-create-this-folder');

    expect(fs.__wasMkdirCalled()).toBe(true);
  });
});
