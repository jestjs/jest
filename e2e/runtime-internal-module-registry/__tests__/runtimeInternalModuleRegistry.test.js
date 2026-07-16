/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

jest.mock('fs');

describe('Runtime internal module registry', () => {
  it('behaves correctly when requiring a module that is used by jest internals', () => {
    const fs = require('fs');

    // We require from this crazy path so that we can mimick Jest (and its
    // transitive deps) being installed alongside a projects deps (e.g. with an
    // NPM3 flat dep tree)
    const jestUtil = require('jest-util');

    // If FS is mocked correctly, this folder won't actually be created on the
    // filesystem
    jestUtil.createDirectory('./dont-create-this-folder');

    expect(fs.__wasMkdirCalled()).toBe(true);
  });
});
