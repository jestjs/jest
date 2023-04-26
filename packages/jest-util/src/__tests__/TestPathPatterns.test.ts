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

describe('TestPathPatterns', () => {
  describe('isSet', () => {
    it('returns false if no patterns specified', () => {
      const testPathPatterns = new TestPathPatterns([]);
      expect(testPathPatterns.isSet()).toBe(false);
    });

    it('returns true if patterns specified', () => {
      const testPathPatterns = new TestPathPatterns(['a']);
      expect(testPathPatterns.isSet()).toBe(true);
    });
  });

  describe('isValid', () => {
    it('returns true for empty patterns', () => {
      const testPathPatterns = new TestPathPatterns([]);
      expect(testPathPatterns.isValid()).toBe(true);
    });

    it('returns true for valid patterns', () => {
      const testPathPatterns = new TestPathPatterns(['abc+', 'z.*']);
      expect(testPathPatterns.isValid()).toBe(true);
    });

    it('returns false for at least one invalid pattern', () => {
      const testPathPatterns = new TestPathPatterns(['abc+', '(', 'z.*']);
      expect(testPathPatterns.isValid()).toBe(false);
    });
  });

  describe('isMatch', () => {
    it('returns true with no patterns', () => {
      const testPathPatterns = new TestPathPatterns([]);
      expect(testPathPatterns.isMatch('/a/b')).toBe(true);
    });

    it('returns true for same path', () => {
      const testPathPatterns = new TestPathPatterns(['/a/b']);
      expect(testPathPatterns.isMatch('/a/b')).toBe(true);
    });

    it('returns true for same path with case insensitive', () => {
      const testPathPatternsUpper = new TestPathPatterns(['/A/B']);
      expect(testPathPatternsUpper.isMatch('/a/b')).toBe(true);
      expect(testPathPatternsUpper.isMatch('/A/B')).toBe(true);

      const testPathPatternsLower = new TestPathPatterns(['/a/b']);
      expect(testPathPatternsLower.isMatch('/A/B')).toBe(true);
      expect(testPathPatternsLower.isMatch('/a/b')).toBe(true);
    });

    it('returns true for contained path', () => {
      const testPathPatterns = new TestPathPatterns(['b/c']);
      expect(testPathPatterns.isMatch('/a/b/c/d')).toBe(true);
    });

    it('returns true for explicit relative path', () => {
      const testPathPatterns = new TestPathPatterns(['./b/c']);
      expect(testPathPatterns.isMatch('/a/b/c')).toBe(true);
    });

    it('returns true for partial file match', () => {
      const testPathPatterns = new TestPathPatterns(['aaa']);
      expect(testPathPatterns.isMatch('/foo/..aaa..')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/..aaa')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/aaa..')).toBe(true);
    });

    it('returns true for path suffix', () => {
      const testPathPatterns = new TestPathPatterns(['c/d']);
      expect(testPathPatterns.isMatch('/a/b/c/d')).toBe(true);
    });

    it('returns true if regex matches', () => {
      const testPathPatterns = new TestPathPatterns(['ab*c?']);

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
      const testPathPatterns = new TestPathPatterns(['a/b', 'c/d']);

      expect(testPathPatterns.isMatch('/foo/a/b')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/c/d')).toBe(true);

      expect(testPathPatterns.isMatch('/foo/a')).toBe(false);
      expect(testPathPatterns.isMatch('/foo/b/c')).toBe(false);
    });

    it('does not normalize Windows paths on POSIX', () => {
      mockSep.mockReturnValue('/');
      const testPathPatterns = new TestPathPatterns(['a\\z', 'a\\\\z']);
      expect(testPathPatterns.isMatch('/foo/a/z')).toBe(false);
    });

    it('normalizes paths for Windows', () => {
      mockSep.mockReturnValue('\\');
      const testPathPatterns = new TestPathPatterns(['a/b']);
      expect(testPathPatterns.isMatch('\\foo\\a\\b')).toBe(true);
    });
  });

  describe('toPretty', () => {
    it('renders a human-readable string', () => {
      const testPathPatterns = new TestPathPatterns(['a/b', 'c/d']);
      expect(testPathPatterns.toPretty()).toMatchSnapshot();
    });
  });
});
