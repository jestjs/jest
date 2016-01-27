/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.autoMockOff();

const path = require('path');
const utils = require('../../lib/utils');

describe('HasteResolver-Cache', () => {
  let HasteResolver;

  const rootDir = path.resolve(__dirname, 'test_root');
  const rootPath = path.resolve(rootDir, 'root.js');
  const config = utils.normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'NodeHasteResolver-Cache',
    rootDir,
  });

  const mockResolveDependencies = (instance) => {
    const fn = instance._resolveDependencies;
    instance._resolveDependencies = jest.genMockFn().mockImplementation(fn);
  };

  beforeEach(() => {
    HasteResolver = require('../../resolvers/HasteResolver');
  });

  describe('genMockFromModule', () => {
    pit('', () => {
      let resolver = new HasteResolver(config, {resetCache: true});
      mockResolveDependencies(resolver);
      return resolver.getDependencies(rootPath).then(
        response => {
          expect(resolver._resolveDependencies).toBeCalled();
          return resolver.end();
        }
      ).then(() => {
        resolver = new HasteResolver(config, {resetCache: false});
        mockResolveDependencies(resolver);
        return resolver.getDependencies(rootPath).then(
          response => {
            expect(resolver._resolveDependencies).not.toBeCalled();
            return resolver.end();
          }
        );
      }).then(() => {
        resolver = new HasteResolver(config, {resetCache: false});
        mockResolveDependencies(resolver);
        resolver._validateCache = () => false;
        return resolver.getDependencies(rootPath).then(
          response => {
            expect(resolver._resolveDependencies).toBeCalled();
            return resolver.end();
          }
        );
      });
    });
  });
});
