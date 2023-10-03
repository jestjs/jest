/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type * as path from 'path';
import TestPathPatterns from '../TestPathPatterns';

const mockSep = jest.fn();
jest.mock('path', () => {
  return {
    ...(jest.requireActual('path') as typeof path),
    get sep() {
      return mockSep() || '/';
    },
  };
});
beforeEach(() => {
  jest.resetAllMocks();
});

const config = {rootDir: ''};

describe('TestPathPatterns', () => {
  describe('isSet', () => {
    it('returns false if no patterns specified', () => {
      const testPathPatterns = new TestPathPatterns([], config);
      expect(testPathPatterns.isSet()).toBe(false);
    });

    it('returns true if patterns specified', () => {
      const testPathPatterns = new TestPathPatterns(['a'], config);
      expect(testPathPatterns.isSet()).toBe(true);
    });
  });

  describe('validate', () => {
    it('succeeds for empty patterns', () => {
      const testPathPatterns = new TestPathPatterns([], config);
      expect(() => testPathPatterns.validate()).not.toThrow();
    });

    it('succeeds for valid patterns', () => {
      const testPathPatterns = new TestPathPatterns(['abc+', 'z.*'], config);
      expect(() => testPathPatterns.validate()).not.toThrow();
    });

    it('fails for at least one invalid pattern', () => {
      const testPathPatterns = new TestPathPatterns(
        ['abc+', '(', 'z.*'],
        config,
      );
      expect(() => testPathPatterns.validate()).toThrow(
        'Invalid regular expression',
      );
    });
  });

  describe('isMatch', () => {
    it('returns true with no patterns', () => {
      const testPathPatterns = new TestPathPatterns([], config);
      expect(testPathPatterns.isMatch('/a/b')).toBe(true);
    });

    it('returns true for same path', () => {
      const testPathPatterns = new TestPathPatterns(['/a/b'], config);
      expect(testPathPatterns.isMatch('/a/b')).toBe(true);
    });

    it('returns true for same path with case insensitive', () => {
      const testPathPatternsUpper = new TestPathPatterns(['/A/B'], config);
      expect(testPathPatternsUpper.isMatch('/a/b')).toBe(true);
      expect(testPathPatternsUpper.isMatch('/A/B')).toBe(true);

      const testPathPatternsLower = new TestPathPatterns(['/a/b'], config);
      expect(testPathPatternsLower.isMatch('/A/B')).toBe(true);
      expect(testPathPatternsLower.isMatch('/a/b')).toBe(true);
    });

    it('returns true for contained path', () => {
      const testPathPatterns = new TestPathPatterns(['b/c'], config);
      expect(testPathPatterns.isMatch('/a/b/c/d')).toBe(true);
    });

    it('returns true for explicit relative path', () => {
      const testPathPatterns = new TestPathPatterns(['./b/c'], {
        rootDir: '/a',
      });
      expect(testPathPatterns.isMatch('/a/b/c')).toBe(true);
    });

    it('returns true for partial file match', () => {
      const testPathPatterns = new TestPathPatterns(['aaa'], config);
      expect(testPathPatterns.isMatch('/foo/..aaa..')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/..aaa')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/aaa..')).toBe(true);
    });

    it('returns true for path suffix', () => {
      const testPathPatterns = new TestPathPatterns(['c/d'], config);
      expect(testPathPatterns.isMatch('/a/b/c/d')).toBe(true);
    });

    it('returns true if regex matches', () => {
      const testPathPatterns = new TestPathPatterns(['ab*c?'], config);

      expect(testPathPatterns.isMatch('/foo/a')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/ab')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/abb')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/ac')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/abc')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/abbc')).toBe(true);

      expect(testPathPatterns.isMatch('/foo/bc')).toBe(false);
    });

    it('returns true only if matches relative path', () => {
      const testPathPatterns = new TestPathPatterns(['home'], {
        rootDir: '/home/myuser/',
      });
      expect(testPathPatterns.isMatch('/home/myuser/LoginPage.js')).toBe(false);
      expect(testPathPatterns.isMatch('/home/myuser/HomePage.js')).toBe(true);
    });

    it('matches absolute paths regardless of rootDir', () => {
      const testPathPatterns = new TestPathPatterns(['/a/b'], {
        rootDir: '/foo/bar',
      });
      expect(testPathPatterns.isMatch('/a/b')).toBe(true);
    });

    it('returns true if match any paths', () => {
      const testPathPatterns = new TestPathPatterns(['a/b', 'c/d'], config);

      expect(testPathPatterns.isMatch('/foo/a/b')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/c/d')).toBe(true);

      expect(testPathPatterns.isMatch('/foo/a')).toBe(false);
      expect(testPathPatterns.isMatch('/foo/b/c')).toBe(false);
    });

    it('does not normalize Windows paths on POSIX', () => {
      mockSep.mockReturnValue('/');
      const testPathPatterns = new TestPathPatterns(['a\\z', 'a\\\\z'], config);
      expect(testPathPatterns.isMatch('/foo/a/z')).toBe(false);
    });

    it('normalizes paths for Windows', () => {
      mockSep.mockReturnValue('\\');
      const testPathPatterns = new TestPathPatterns(['a/b'], config);
      expect(testPathPatterns.isMatch('\\foo\\a\\b')).toBe(true);
    });
  });

  describe('toPretty', () => {
    it('renders a human-readable string', () => {
      const testPathPatterns = new TestPathPatterns(['a/b', 'c/d'], config);
      expect(testPathPatterns.toPretty()).toMatchSnapshot();
    });
  });
});
