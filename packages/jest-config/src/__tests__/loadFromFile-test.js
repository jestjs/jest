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

const loadFromFile = require('../loadFromFile');

describe('loadFromFile', () => {
  const MOCK_FILE_INFO = {
    'brokenConfig.json': `{
      "testMatch": ["match.js"
    }`,
    'config.json': `{
      "testMatch": ["match.js"]
    }`,
    'configWithRootDir.json': `{
      "rootDir": "testDir"
    }`,
  };

  beforeEach(() => {
    require('fs').__setMockFiles(MOCK_FILE_INFO);
  });

  it('loads configuration from a file at `filePath`.', () => {
    const options = loadFromFile('config.json', {});
    expect(options.testMatch).toEqual(['match.js']);
  });

  it('throws if the file at `filePath` cannot be parsed as JSON.', () => {
    expect(() => loadFromFile('brokenConfig.json', {})).toThrow();
  });

  it('uses the current working directory if `rootDir` is not defined.', () => {
    const options = loadFromFile('config.json', {});
    expect(options.rootDir).toEqual(process.cwd());
  });
});
