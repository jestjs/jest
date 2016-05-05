/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.unmock('../read')
  .unmock('jest-util')

describe('readConfig', () => {
  let readConfig;
  let normalizeConfig;
  let rootDir;

  beforeEach(() => {
    readConfig = require('../read');
    normalizeConfig = require('../normalize');
    normalizeConfig.mockImplementation(config => config);
    rootDir = '/root/path/foo'
  });

  describe('config object', () => {
    beforeEach(() => {

    });

    pit('defaults the name and rootDir', () => {
      return readConfig({
        config: {},
      }, rootDir).then(config => {
        expect(config.name).toBe('-root-path-foo');
        expect(config.rootDir).toBe(rootDir);
      });
    });

    pit('uses the privded name and rootDir', () => {
      return readConfig({
        config: {
          name: 'bar',
          rootDir: '/root/path/bar',
        },
      }, rootDir).then(config => {
        expect(config.name).toBe('bar');
        expect(config.rootDir).toBe('/root/path/bar');
      });
    });
  });
});
