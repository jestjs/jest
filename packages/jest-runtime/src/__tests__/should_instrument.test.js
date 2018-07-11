/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import shouldInstrument from '../should_instrument';

describe('should_instrument', () => {
  const defaultFilename = 'source_file.test.js';
  const defaultOptions = {
    collectCoverage: true,
  };
  const defaultConfig = {
    rootDir: '/',
  };

  describe('should return true', () => {
    const testShouldInstrument = (
      filename = defaultFilename,
      options = defaultOptions,
      config = defaultConfig,
    ) => {
      const result = shouldInstrument(filename, options, config);
      expect(result).toBe(true);
    };

    it('when testRegex provided and file is not a test file', () => {
      testShouldInstrument('source_file.js', defaultOptions, {
        testRegex: '.*\\.(test)\\.(js)$',
      });
    });

    it('when testMatch is provided and file is not a test file', () => {
      testShouldInstrument('source_file.js', defaultOptions, {
        testMatch: ['**/?(*.)(test).js'],
      });
    });

    it('should return true when file is in collectCoverageOnlyFrom when provided', () => {
      testShouldInstrument(
        'collect/only/from/here.js',

        {
          collectCoverage: true,
          collectCoverageOnlyFrom: {'collect/only/from/here.js': true},
        },
        defaultConfig,
      );
    });

    it('should return true when filename matches collectCoverageFrom', () => {
      testShouldInstrument(
        'do/collect/coverage.js',
        {
          collectCoverage: true,
          collectCoverageFrom: ['!**/dont/**/*.js', '**/do/**/*.js'],
        },
        defaultConfig,
      );
    });

    it('should should match invalid globs, to be removed in the next major', () => {
      const testSingleCollectCoverageFrom = pattern =>
        testShouldInstrument(
          'do/collect/coverage.js',
          {
            collectCoverage: true,
            collectCoverageFrom: [pattern],
          },
          defaultConfig,
        );

      testSingleCollectCoverageFrom('**/do/**/*.{js}');
      testSingleCollectCoverageFrom('**/do/**/*.{js|ts}');
      testSingleCollectCoverageFrom('**/do/**.js');
    });

    it('should return true if the file is not in coveragePathIgnorePatterns', () => {
      testShouldInstrument('do/collect/coverage.js', defaultOptions, {
        coveragePathIgnorePatterns: ['dont'],
        rootDir: '/',
      });
    });

    it('should return true if file is a testfile but forceCoverageMatch is set', () => {
      testShouldInstrument('do/collect/sum.coverage.test.js', defaultOptions, {
        forceCoverageMatch: ['**/*.(coverage).(test).js'],
        rootDir: '/',
        testRegex: '.*\\.(test)\\.(js)$',
      });
    });
  });

  describe('should return false', () => {
    const testShouldInstrument = (
      filename = defaultFilename,
      options = defaultOptions,
      config = defaultConfig,
    ) => {
      const result = shouldInstrument(filename, options, config);
      expect(result).toBe(false);
    };

    it('if collectCoverage is falsy', () => {
      testShouldInstrument(
        'source_file.js',
        {
          collectCoverage: false,
        },
        defaultConfig,
      );
    });

    it('when testRegex provided and filename is a test file', () => {
      testShouldInstrument(defaultFilename, defaultOptions, {
        testRegex: '.*\\.(test)\\.(js)$',
      });
    });

    it('when testMatch is provided and file is a test file', () => {
      testShouldInstrument(defaultFilename, defaultOptions, {
        testMatch: ['**/?(*.)(test).js'],
      });
    });

    it('when file is not in collectCoverageOnlyFrom when provided', () => {
      testShouldInstrument(
        'source_file.js',
        {
          collectCoverage: true,
          collectCoverageOnlyFrom: {'collect/only/from/here.js': true},
        },
        defaultConfig,
      );
    });

    it('when filename does not match collectCoverageFrom', () => {
      testShouldInstrument(
        'dont/collect/coverage.js',
        {
          collectCoverage: true,
          collectCoverageFrom: ['!**/dont/**/*.js', '**/do/**/*.js'],
        },
        defaultConfig,
      );
    });

    it('if the file is in coveragePathIgnorePatterns', () => {
      testShouldInstrument('dont/collect/coverage.js', defaultOptions, {
        coveragePathIgnorePatterns: ['dont'],
        rootDir: '/',
      });
    });

    it('if file is in mock patterns', () => {
      const filename =
        process.platform === 'win32'
          ? 'dont\\__mocks__\\collect\\coverage.js'
          : 'dont/__mocks__/collect/coverage.js';

      testShouldInstrument(filename, defaultOptions, defaultConfig);
    });
  });
});
