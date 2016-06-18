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
jest.mock('jest-resolve');

describe('normalize', () => {
  let path;
  let root;
  let utils;
  let normalize;
  let expectedPathFooBar;
  let expectedPathFooQux;
  let expectedPathAbs;
  let expectedPathAbsAnother;

  // Windows uses backslashes for path separators, which need to be escaped in
  // regular expressions. This little helper function helps us generate the
  // expected strings for checking path patterns.
  function joinForPattern() {
    return Array.prototype.join.call(
      arguments,
      utils.escapeStrForRegex(path.sep)
    );
  }

  // this helper takes a path starting from root and normalize it to unix style
  function uniformPath(pathToUniform) {
    const resolved = path.resolve(pathToUniform);
    return '/' + resolved.replace(root, '').split(path.sep).join('/');
  }

  beforeEach(() => {
    path = require('path');
    root = path.resolve('/');
    expectedPathFooBar = path.join(root, 'root', 'path', 'foo', 'bar', 'baz');
    expectedPathFooQux = path.join(root, 'root', 'path', 'foo', 'qux', 'quux');
    expectedPathAbs = path.join(root, 'an', 'abs', 'path');
    expectedPathAbsAnother = path.join(root, 'another', 'abs', 'path');
    utils = require('jest-util');
    normalize = require('../normalize');
  });

  it('errors when an invalid config option is passed in', () => {
    const error = console.error;
    console.error = jest.fn();
    normalize({
      rootDir: '/root/path/foo',
      thisIsAnInvalidConfigKey: 'with a value even!',
    });

    expect(console.error).toBeCalledWith(
      'Error: Unknown config option "thisIsAnInvalidConfigKey" with value ' +
      '"with a value even!". This is either a typing error or another user ' +
      'mistake and fixing it will remove this message.'
    );

    console.error = error;
  });

  it('picks a name based on the rootDir', () => {
    expect(normalize({
      rootDir: '/root/path/foo',
    }).name).toBe('-root-path-foo');
  });

  it('keeps custom names based on the rootDir', () => {
    expect(normalize({
      name: 'custom-name',
      rootDir: '/root/path/foo',
    }).name).toBe('custom-name');
  });

  describe('rootDir', () => {
    it('throws if the config is missing a rootDir property', () => {
      expect(() => {
        normalize({});
      }).toThrow(new Error('No rootDir config value found!'));
    });
  });

  describe('automock', () => {
    it('falsy automock is not overwritten', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        automock: false,
      });

      expect(config.automock).toBe(false);
    });
  });

  describe('collectCoverageOnlyFrom', () => {
    it('normalizes all paths relative to rootDir', () => {
      const config = normalize({
        rootDir: '/root/path/foo/',
        collectCoverageOnlyFrom: {
          'bar/baz': true,
          'qux/quux/': true,
        },
      }, '/root/path');

      const expected = {};
      expected[expectedPathFooBar] = true;
      expected[expectedPathFooQux] = true;

      expect(config.collectCoverageOnlyFrom).toEqual(expected);
    });

    it('does not change absolute paths', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        collectCoverageOnlyFrom: {
          '/an/abs/path': true,
          '/another/abs/path': true,
        },
      });

      const expected = {};
      expected[expectedPathAbs] = true;
      expected[expectedPathAbsAnother] = true;

      expect(config.collectCoverageOnlyFrom).toEqual(expected);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        collectCoverageOnlyFrom: {
          '<rootDir>/bar/baz': true,
        },
      });

      const expected = {};
      expected[expectedPathFooBar] = true;

      expect(config.collectCoverageOnlyFrom).toEqual(expected);
    });
  });

  describe('testPathDirs', () => {
    it('normalizes all paths relative to rootDir', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        testPathDirs: [
          'bar/baz',
          'qux/quux/',
        ],
      }, '/root/path');

      expect(config.testPathDirs).toEqual([
        expectedPathFooBar, expectedPathFooQux,
      ]);
    });

    it('does not change absolute paths', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        testPathDirs: [
          '/an/abs/path',
          '/another/abs/path',
        ],
      });

      expect(config.testPathDirs).toEqual([
        expectedPathAbs, expectedPathAbsAnother,
      ]);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        testPathDirs: [
          '<rootDir>/bar/baz',
        ],
      });

      expect(config.testPathDirs).toEqual([expectedPathFooBar]);
    });
  });

  describe('scriptPreprocessor', () => {
    it('normalizes the path according to rootDir', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        scriptPreprocessor: 'bar/baz',
      }, '/root/path');

      expect(config.scriptPreprocessor).toEqual(expectedPathFooBar);
    });

    it('does not change absolute paths', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        scriptPreprocessor: '/an/abs/path',
      });

      expect(config.scriptPreprocessor).toEqual(expectedPathAbs);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        scriptPreprocessor: '<rootDir>/bar/baz',
      });

      expect(config.scriptPreprocessor).toEqual(expectedPathFooBar);
    });
  });

  describe('setupTestFrameworkScriptFile', () => {
    it('normalizes the path according to rootDir', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: 'bar/baz',
      }, '/root/path');

      expect(config.setupTestFrameworkScriptFile).toEqual(expectedPathFooBar);
    });

    it('does not change absolute paths', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: '/an/abs/path',
      });

      expect(config.setupTestFrameworkScriptFile).toEqual(expectedPathAbs);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: '<rootDir>/bar/baz',
      });

      expect(config.setupTestFrameworkScriptFile).toEqual(expectedPathFooBar);
    });
  });

  describe('setupTestFrameworkScriptFile', () => {
    it('normalizes the path according to rootDir', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: 'bar/baz',
      }, '/root/path');

      expect(config.setupTestFrameworkScriptFile).toEqual(expectedPathFooBar);
    });

    it('does not change absolute paths', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: '/an/abs/path',
      });

      expect(config.setupTestFrameworkScriptFile).toEqual(expectedPathAbs);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: '<rootDir>/bar/baz',
      });

      expect(config.setupTestFrameworkScriptFile).toEqual(expectedPathFooBar);
    });
  });

  describe('testPathIgnorePatterns', () => {
    it('does not normalize paths relative to rootDir', () => {
      // This is a list of patterns, so we can't assume any of them are
      // directories
      const config = normalize({
        rootDir: '/root/path/foo',
        testPathIgnorePatterns: [
          'bar/baz',
          'qux/quux',
        ],
      }, '/root/path');

      expect(config.testPathIgnorePatterns).toEqual([
        joinForPattern('bar', 'baz'),
        joinForPattern('qux', 'quux'),
      ]);
    });

    it('does not normalize trailing slashes', () => {
      // This is a list of patterns, so we can't assume any of them are
      // directories
      const config = normalize({
        rootDir: '/root/path/foo',
        testPathIgnorePatterns: [
          'bar/baz',
          'qux/quux/',
        ],
      });

      expect(config.testPathIgnorePatterns).toEqual([
        joinForPattern('bar', 'baz'),
        joinForPattern('qux', 'quux', ''),
      ]);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        testPathIgnorePatterns: [
          'hasNoToken',
          '<rootDir>/hasAToken',
        ],
      });

      expect(config.testPathIgnorePatterns).toEqual([
        'hasNoToken',
        joinForPattern('', 'root', 'path', 'foo', 'hasAToken'),
      ]);
    });
  });

  describe('modulePathIgnorePatterns', () => {
    it('does not normalize paths relative to rootDir', () => {
      // This is a list of patterns, so we can't assume any of them are
      // directories
      const config = normalize({
        rootDir: '/root/path/foo',
        modulePathIgnorePatterns: [
          'bar/baz',
          'qux/quux',
        ],
      }, '/root/path');

      expect(config.modulePathIgnorePatterns).toEqual([
        joinForPattern('bar', 'baz'),
        joinForPattern('qux', 'quux'),
      ]);
    });

    it('does not normalize trailing slashes', () => {
      // This is a list of patterns, so we can't assume any of them are
      // directories
      const config = normalize({
        rootDir: '/root/path/foo',
        modulePathIgnorePatterns: [
          'bar/baz',
          'qux/quux/',
        ],
      });

      expect(config.modulePathIgnorePatterns).toEqual([
        joinForPattern('bar', 'baz'),
        joinForPattern('qux', 'quux', ''),
      ]);
    });

    it('substitutes <rootDir> tokens', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        modulePathIgnorePatterns: [
          'hasNoToken',
          '<rootDir>/hasAToken',
        ],
      });

      expect(config.modulePathIgnorePatterns).toEqual([
        'hasNoToken',
        joinForPattern('', 'root', 'path', 'foo', 'hasAToken'),
      ]);
    });
  });

  describe('testRunner', () => {
    it('defaults to Jasmine 2', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
      });

      expect(config.testRunner).toMatch('jasmine2');
    });

    it('can be changed to jasmine1', () => {
      const config = normalize({
        rootDir: '/root/path/foo',
        testRunner: 'jasmine1',
      });

      expect(config.testRunner).toMatch('jasmine1');
    });

    it('is overwritten by argv', () => {
      const config = normalize(
        {
          rootDir: '/root/path/foo',
        },
        {
          testRunner: 'jasmine1',
        }
      );

      expect(config.testRunner).toMatch('jasmine1');
    });
  });

  describe('testEnvironment', () => {
    let Resolver;
    beforeEach(() => {
      Resolver = require('jest-resolve');
      Resolver.findNodeModule = jest.fn(name => {
        if (name === 'jsdom') {
          return 'node_modules/jest-environment-jsdom';
        }
        return null;
      });
    });

    it('correctly resolves to an environment', () => {
      const config = normalize({
        rootDir: '/root',
        testEnvironment: 'jsdom',
      });

      expect(config.testEnvironment)
        .toEqual('node_modules/jest-environment-jsdom');
    });

    it('throws on invalid environment names', () => {
      expect(() => normalize({
        rootDir: '/root',
        testEnvironment: 'phantom',
      })).toThrow(new Error(
        `Jest: test environment "phantom" cannot be found. Make sure the ` +
        `"testEnvironment" configuration option points to an existing node ` +
        `module.`
      ));
    });
  });

  describe('babel-jest', () => {
    let Resolver;
    beforeEach(() => {
      Resolver = require('jest-resolve');
      Resolver.findNodeModule = jest.fn(name => 'node_modules/' + name);
    });

    it('correctly identifies and uses babel-jest', () => {
      const config = normalize({
        rootDir: '/root',
      });

      expect(config.usesBabelJest).toBe(true);
      const preprocessorPath = uniformPath(config.scriptPreprocessor);
      expect(preprocessorPath).toEqual('/root/node_modules/babel-jest');
      expect(config.setupFiles.map(uniformPath))
        .toEqual(['/root/node_modules/babel-polyfill']);
    });

    it(`doesn't use babel-jest if its not available`, () => {
      Resolver.findNodeModule.mockImplementation(() => null);

      const config = normalize({
        rootDir: '/root',
      });

      expect(config.usesBabelJest).toEqual(undefined);
      expect(config.scriptPreprocessor).toEqual(undefined);
      expect(config.setupFiles).toEqual([]);
    });

    it('uses polyfills if babel-jest is explicitly specified', () => {
      const config = normalize({
        rootDir: '/root',
        scriptPreprocessor:
          '<rootDir>/' + Resolver.findNodeModule('babel-jest'),
      });

      expect(config.usesBabelJest).toBe(true);
      expect(config.setupFiles.map(uniformPath))
        .toEqual(['/root/node_modules/babel-polyfill']);
    });

    it('correctly identifies react-native', () => {
      // The default Resolver.findNodeModule fn finds `react-native`.
      let config = normalize({
        rootDir: '/root',
      });
      expect(config.preprocessorIgnorePatterns).toEqual([]);

      // This version doesn't find react native and sets the default to
      // /node_modules/
      Resolver.findNodeModule.mockImplementation(() => null);
      config = normalize({
        rootDir: '/root',
      });

      expect(config.preprocessorIgnorePatterns.map(uniformPath))
        .toEqual(['/node_modules']);
    });
  });
});
