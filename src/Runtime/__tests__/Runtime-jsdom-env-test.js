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

jest.disableAutomock();

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

const path = require('path');
const normalizeConfig = require('../../config/normalize');

describe('Runtime', () => {
  let Runtime;
  let HasteResolver;
  let JSDOMEnvironment;

  const rootDir = path.join(__dirname, 'test_root');
  const config = normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'Runtime-jsdom-env-tests',
    rootDir,
  });

  function buildLoader() {
    const environment = new JSDOMEnvironment(config);
    const resolver = new HasteResolver(config, {resetCache: false});
    return resolver.getHasteMap().then(
      response => resolver.end().then(() =>
        new Runtime(config, environment, response)
      )
    );
  }

  beforeEach(() => {
    Runtime = require('../Runtime');
    HasteResolver = require('../../resolvers/HasteResolver');
    JSDOMEnvironment = require('jest-environment-jsdom');
  });

  describe('requireModule', () => {
    pit('emulates a node stack trace during module load', () => {
      return buildLoader().then(loader => {
        let hasThrown = false;
        try {
          loader.requireModule(
            __filename,
            './test_root/throwing.js'
          );
        } catch (err) {
          hasThrown = true;
          expect(err.stack).toMatch(/^Error: throwing\s+at Object.<anonymous>/);
        }
        expect(hasThrown).toBe(true);
      });
    });

    pit('emulates a node stack trace during function execution', () => {
      return buildLoader().then(loader => {
        let hasThrown = false;
        const sum = loader.requireModule(
          __filename,
          './test_root/throwing-fn.js'
        );

        try {
          sum();
        } catch (err) {
          hasThrown = true;

          if (process.platform === 'win32') {
            expect(err.stack).toMatch(
              /^Error: throwing fn\s+at sum.+Runtime\\__tests__\\test_root\\throwing-fn.js:12:9/
            );
          } else {
            expect(err.stack).toMatch(
              /^Error: throwing fn\s+at sum.+Runtime\/__tests__\/test_root\/throwing-fn.js:12:9/
            );
          }
        }
        expect(hasThrown).toBe(true);
      });
    });
  });
});
