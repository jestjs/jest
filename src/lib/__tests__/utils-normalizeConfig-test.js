/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();

describe('utils-normalizeConfig', function() {
  var utils;

  beforeEach(function() {
    utils = require('../utils');
  });

  it('throws when an invalid config option is passed in', function() {
    expect(function() {
      utils.normalizeConfig({
        rootDir: '/root/path/foo',
        thisIsAnInvalidConfigKey: 'with a value even!'
      });
    }).toThrow('Unknown config option: thisIsAnInvalidConfigKey');
  });

  describe('rootDir', function() {
    it('throws if the config is missing a rootDir property', function() {
      expect(function() {
        utils.normalizeConfig({});
      }).toThrow('No rootDir config value found!');
    });
  });

  describe('collectCoverageOnlyFrom', function() {
    it('normalizes all paths relative to rootDir', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo/',
        collectCoverageOnlyFrom: {
          'bar/baz': true,
          'qux/quux/': true
        }
      }, '/root/path');

      expect(config.collectCoverageOnlyFrom).toEqual({
        '/root/path/foo/bar/baz': true,
        '/root/path/foo/qux/quux': true
      });
    });

    it('does not change absolute paths', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        collectCoverageOnlyFrom: {
          '/an/abs/path': true,
          '/another/abs/path': true
        }
      });

      expect(config.collectCoverageOnlyFrom).toEqual({
        '/an/abs/path': true,
        '/another/abs/path': true
      });
    });

    it('substitutes <rootDir> tokens', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        collectCoverageOnlyFrom: {
          '<rootDir>/bar/baz': true
        }
      });

      expect(config.collectCoverageOnlyFrom).toEqual({
        '/root/path/foo/bar/baz': true
      });
    });
  });

  describe('testPathDirs', function() {
    it('normalizes all paths relative to rootDir', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        testPathDirs: [
          'bar/baz',
          'qux/quux/'
        ]
      }, '/root/path');

      expect(config.testPathDirs).toEqual([
        '/root/path/foo/bar/baz',
        '/root/path/foo/qux/quux'
      ]);
    });

    it('does not change absolute paths', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        testPathDirs: [
          '/an/abs/path',
          '/another/abs/path'
        ]
      });

      expect(config.testPathDirs).toEqual([
        '/an/abs/path',
        '/another/abs/path'
      ]);
    });

    it('substitutes <rootDir> tokens', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        testPathDirs: [
          '<rootDir>/bar/baz'
        ]
      });

      expect(config.testPathDirs).toEqual(['/root/path/foo/bar/baz']);
    });
  });

  describe('scriptPreprocessor', function() {
    it('normalizes the path according to rootDir', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        scriptPreprocessor: 'bar/baz'
      }, '/root/path');

      expect(config.scriptPreprocessor).toEqual('/root/path/foo/bar/baz');
    });

    it('does not change absolute paths', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        scriptPreprocessor: '/an/abs/path'
      });

      expect(config.scriptPreprocessor).toEqual('/an/abs/path');
    });

    it('substitutes <rootDir> tokens', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        scriptPreprocessor: '<rootDir>/bar/baz'
      });

      expect(config.scriptPreprocessor).toEqual('/root/path/foo/bar/baz');
    });
  });

  describe('setupEnvScriptFile', function() {
    it('normalizes the path according to rootDir', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        setupEnvScriptFile: 'bar/baz'
      }, '/root/path');

      expect(config.setupEnvScriptFile).toEqual('/root/path/foo/bar/baz');
    });

    it('does not change absolute paths', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        setupEnvScriptFile: '/an/abs/path'
      });

      expect(config.setupEnvScriptFile).toEqual('/an/abs/path');
    });

    it('substitutes <rootDir> tokens', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        setupEnvScriptFile: '<rootDir>/bar/baz'
      });

      expect(config.setupEnvScriptFile).toEqual('/root/path/foo/bar/baz');
    });
  });

  describe('setupTestFrameworkScriptFile', function() {
    it('normalizes the path according to rootDir', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: 'bar/baz'
      }, '/root/path');

      expect(config.setupTestFrameworkScriptFile).toEqual(
        '/root/path/foo/bar/baz'
      );
    });

    it('does not change absolute paths', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: '/an/abs/path'
      });

      expect(config.setupTestFrameworkScriptFile).toEqual('/an/abs/path');
    });

    it('substitutes <rootDir> tokens', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        setupTestFrameworkScriptFile: '<rootDir>/bar/baz'
      });

      expect(config.setupTestFrameworkScriptFile).toEqual(
        '/root/path/foo/bar/baz'
      );
    });
  });

  describe('testPathIgnorePatterns', function() {
    it('does not normalize paths relative to rootDir', function() {
      // This is a list of patterns, so we can't assume any of them are
      // directories
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        testPathIgnorePatterns: [
          'bar/baz',
          'qux/quux'
        ]
      }, '/root/path');

      expect(config.testPathIgnorePatterns).toEqual([
        'bar/baz',
        'qux/quux'
      ]);
    });

    it('does not normalize trailing slashes', function() {
      // This is a list of patterns, so we can't assume any of them are
      // directories
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        testPathIgnorePatterns: [
          'bar/baz',
          'qux/quux/'
        ]
      });

      expect(config.testPathIgnorePatterns).toEqual([
        'bar/baz',
        'qux/quux/'
      ]);
    });

    it('substitutes <rootDir> tokens', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        testPathIgnorePatterns: [
          'hasNoToken',
          '<rootDir>/hasAToken'
        ]
      });

      expect(config.testPathIgnorePatterns).toEqual([
        'hasNoToken',
        '/root/path/foo/hasAToken'
      ]);
    });
  });

  describe('modulePathIgnorePatterns', function() {
    it('does not normalize paths relative to rootDir', function() {
      // This is a list of patterns, so we can't assume any of them are
      // directories
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        modulePathIgnorePatterns: [
          'bar/baz',
          'qux/quux'
        ]
      }, '/root/path');

      expect(config.modulePathIgnorePatterns).toEqual([
        'bar/baz',
        'qux/quux'
      ]);
    });

    it('does not normalize trailing slashes', function() {
      // This is a list of patterns, so we can't assume any of them are
      // directories
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        modulePathIgnorePatterns: [
          'bar/baz',
          'qux/quux/'
        ]
      });

      expect(config.modulePathIgnorePatterns).toEqual([
        'bar/baz',
        'qux/quux/'
      ]);
    });

    it('substitutes <rootDir> tokens', function() {
      var config = utils.normalizeConfig({
        rootDir: '/root/path/foo',
        modulePathIgnorePatterns: [
          'hasNoToken',
          '<rootDir>/hasAToken'
        ]
      });

      expect(config.modulePathIgnorePatterns).toEqual([
        'hasNoToken',
        '/root/path/foo/hasAToken'
      ]);
    });
  });
});
