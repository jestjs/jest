/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

jest.mock('fs');

const path = require('path');

const loadFromFile = require('../loadFromFile');

describe('loadFromFile', () => {
  const MOCK_FILE_INFO = {
    'brokenConfig.js': `{
      "testMatch": ["match.js"
    }`,
    'config.js': `{
      "testMatch": ["match.js"]
    }`,
    'configWithRootDir.js': `{
      "rootDir": "testDir"
    }`,
  };

  beforeEach(() => {
    require('fs').__setMockFiles(MOCK_FILE_INFO);
  });

  it('loads configuration from a file at `filePath`.', async () => {
    const config = await loadFromFile('config.js', {});
    expect(config.testMatch).toEqual(['match.js']);
  });

  it('throws if the file at `filePath` cannot be parsed as JSON.', () => {
    return loadFromFile('brokenConfig.js', {}).catch(e =>
      expect(e).toBeInstanceOf(Error));
  });

  it('uses the current working directory if `rootDir` is not defined.', async () => {
    const config = await loadFromFile('config.js', {});
    expect(config.rootDir).toEqual(process.cwd());
  });
});
