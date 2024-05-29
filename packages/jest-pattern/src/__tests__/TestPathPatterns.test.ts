/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type * as path from 'path';
import {
  TestPathPatterns,
  TestPathPatternsExecutor,
  type TestPathPatternsExecutorOptions,
} from '../TestPathPatterns';

const mockSep: jest.Mock<() => string> = jest.fn();
jest.mock('path', () => {
  return {
    ...jest.requireActual('path'),
    get sep() {
      return mockSep() || '/';
    },
  } as typeof path;
});
beforeEach(() => {
  jest.resetAllMocks();
});

const config = {rootDir: ''};

interface TestPathPatternsLike {
  isSet(): boolean;
  isValid(): boolean;
  toPretty(): string;
}

const testPathPatternsLikeTests = (
  makePatterns: (
    patterns: Array<string>,
    options: TestPathPatternsExecutorOptions,
  ) => TestPathPatternsLike,
) => {
  describe('isSet', () => {
    it('returns false if no patterns specified', () => {
      const testPathPatterns = makePatterns([], config);
      expect(testPathPatterns.isSet()).toBe(false);
    });

    it('returns true if patterns specified', () => {
      const testPathPatterns = makePatterns(['a'], config);
      expect(testPathPatterns.isSet()).toBe(true);
    });
  });

  describe('isValid', () => {
    it('succeeds for empty patterns', () => {
      const testPathPatterns = makePatterns([], config);
      expect(testPathPatterns.isValid()).toBe(true);
    });

    it('succeeds for valid patterns', () => {
      const testPathPatterns = makePatterns(['abc+', 'z.*'], config);
      expect(testPathPatterns.isValid()).toBe(true);
    });

    it('fails for at least one invalid pattern', () => {
      const testPathPatterns = makePatterns(['abc+', '(', 'z.*'], config);
      expect(testPathPatterns.isValid()).toBe(false);
    });
  });

  describe('toPretty', () => {
    it('renders a human-readable string', () => {
      const testPathPatterns = makePatterns(['a/b', 'c/d'], config);
      expect(testPathPatterns.toPretty()).toMatchSnapshot();
    });
  });
};

describe('TestPathPatterns', () => {
  testPathPatternsLikeTests(
    (patterns: Array<string>, _: TestPathPatternsExecutorOptions) =>
      new TestPathPatterns(patterns),
  );
});

describe('TestPathPatternsExecutor', () => {
  const makeExecutor = (
    patterns: Array<string>,
    options: TestPathPatternsExecutorOptions,
  ) => new TestPathPatternsExecutor(new TestPathPatterns(patterns), options);

  testPathPatternsLikeTests(makeExecutor);

  describe('isMatch', () => {
    it('returns true with no patterns', () => {
      const testPathPatterns = makeExecutor([], config);
      expect(testPathPatterns.isMatch('/a/b')).toBe(true);
    });

    it('returns true for same path', () => {
      const testPathPatterns = makeExecutor(['/a/b'], config);
      expect(testPathPatterns.isMatch('/a/b')).toBe(true);
    });

    it('returns true for same path with case insensitive', () => {
      const testPathPatternsUpper = makeExecutor(['/A/B'], config);
      expect(testPathPatternsUpper.isMatch('/a/b')).toBe(true);
      expect(testPathPatternsUpper.isMatch('/A/B')).toBe(true);

      const testPathPatternsLower = makeExecutor(['/a/b'], config);
      expect(testPathPatternsLower.isMatch('/A/B')).toBe(true);
      expect(testPathPatternsLower.isMatch('/a/b')).toBe(true);
    });

    it('returns true for contained path', () => {
      const testPathPatterns = makeExecutor(['b/c'], config);
      expect(testPathPatterns.isMatch('/a/b/c/d')).toBe(true);
    });

    it('returns true for explicit relative path', () => {
      const testPathPatterns = makeExecutor(['./b/c'], {
        rootDir: '/a',
      });
      expect(testPathPatterns.isMatch('/a/b/c')).toBe(true);
    });

    it('returns true for partial file match', () => {
      const testPathPatterns = makeExecutor(['aaa'], config);
      expect(testPathPatterns.isMatch('/foo/..aaa..')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/..aaa')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/aaa..')).toBe(true);
    });

    it('returns true for path suffix', () => {
      const testPathPatterns = makeExecutor(['c/d'], config);
      expect(testPathPatterns.isMatch('/a/b/c/d')).toBe(true);
    });

    it('returns true if regex matches', () => {
      const testPathPatterns = makeExecutor(['ab*c?'], config);

      expect(testPathPatterns.isMatch('/foo/a')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/ab')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/abb')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/ac')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/abc')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/abbc')).toBe(true);

      expect(testPathPatterns.isMatch('/foo/bc')).toBe(false);
    });

    it('returns true only if matches relative path', () => {
      const testPathPatterns = makeExecutor(['home'], {
        rootDir: '/home/myuser/',
      });
      expect(testPathPatterns.isMatch('/home/myuser/LoginPage.js')).toBe(false);
      expect(testPathPatterns.isMatch('/home/myuser/HomePage.js')).toBe(true);
    });

    it('matches absolute paths regardless of rootDir', () => {
      const testPathPatterns = makeExecutor(['/a/b'], {
        rootDir: '/foo/bar',
      });
      expect(testPathPatterns.isMatch('/a/b')).toBe(true);
    });

    it('returns true if match any paths', () => {
      const testPathPatterns = makeExecutor(['a/b', 'c/d'], config);

      expect(testPathPatterns.isMatch('/foo/a/b')).toBe(true);
      expect(testPathPatterns.isMatch('/foo/c/d')).toBe(true);

      expect(testPathPatterns.isMatch('/foo/a')).toBe(false);
      expect(testPathPatterns.isMatch('/foo/b/c')).toBe(false);
    });

    it('does not normalize Windows paths on POSIX', () => {
      mockSep.mockReturnValue('/');
      const testPathPatterns = makeExecutor(['a\\z', 'a\\\\z'], config);
      expect(testPathPatterns.isMatch('/foo/a/z')).toBe(false);
    });

    it('normalizes paths for Windows', () => {
      mockSep.mockReturnValue('\\');
      const testPathPatterns = makeExecutor(['a/b'], config);
      expect(testPathPatterns.isMatch('\\foo\\a\\b')).toBe(true);
    });
  });
});
