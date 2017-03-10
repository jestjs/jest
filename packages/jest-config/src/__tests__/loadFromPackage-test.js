/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

jest.mock('read-pkg');

const path = require('path');
const loadFromPackage = require('../loadFromPackage');

describe('loadFromPackage', () => {
  const MOCK_FILE_INFO = {
    '.': `{
      "jest": {
        "testMatch": ["match.js"]
      }
    }`,
    broken: `{
      "jest": {
        "testMatch": ["match.js"
      }
    }`,
    withRootDir: `{
      "jest": {
        "rootDir": "testDir"
      }
    }`,
    withoutJest: `{
    }`,
  };

  beforeEach(() => {
    require('read-pkg').__setMockFiles(MOCK_FILE_INFO);
  });

  it('loads configuration from a `package.json` at `root`', async () => {
    const config = await loadFromPackage('.', {});
    expect(config.testMatch).toEqual(['match.js']);
  });

  it('returns a config object even if `jest` is not defined in `package.json`.', async () => {
    const config = await loadFromPackage('withoutJest', {});
    expect(config).toEqual(expect.anything());
  });

  it('returns null if the `package.json` at `root` cannot be parsed.', async () => {
    const result = await loadFromPackage('broken', {});
    expect(result).toBeNull();
  });
});
