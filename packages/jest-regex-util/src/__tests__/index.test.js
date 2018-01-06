jest.mock('path');

import {replacePathSepForRegex} from '../index';
import path from 'path';

describe('replacePathSepForRegex()', () => {
  const testPatternsFrom5216 = [
    'jest-config\\/.*normalize',
    'jest-config/.*normalize',
    'jest-config\\.*normalize',
    'jest-config\\\\.*normalize',
  ];

  describe('posix', () => {
    beforeEach(() => (path.sep = '/'));

    it('should return the path', () => {
      const expected = {};
      expect(replacePathSepForRegex(expected)).toBe(expected);
    });

    // Confirming existing behavior; could be changed to improve cross-platform support
    it('should not replace Windows path separators', () => {
      expect(replacePathSepForRegex('a\\.*b')).toBe('a\\.*b');
      expect(replacePathSepForRegex('a\\\\.*b')).toBe('a\\\\.*b');
    });

    // Bonus: Test cases from https://github.com/facebook/jest#5216
    it('should match the expected output from #5216', () => {
      expect(
        testPatternsFrom5216.map(replacePathSepForRegex),
      ).toMatchSnapshot();
    });
  });

  describe('win32', () => {
    beforeEach(() => (path.sep = '\\'));

    it('should escape Windows path separators', () => {
      expect(replacePathSepForRegex('a\\b\\c')).toBe('a\\\\b\\\\c');
    });

    it('should replace POSIX path separators', () => {
      expect(replacePathSepForRegex('a/b/c')).toBe('a\\\\b\\\\c');
    });

    it('should not escape an escaped period', () => {
      expect(replacePathSepForRegex('a\\.dotfile')).toBe('a\\.dotfile');
      expect(replacePathSepForRegex('a\\\\\\.dotfile')).toBe('a\\\\\\.dotfile');
    });

    it('should not escape an escaped Windows path separator', () => {
      expect(replacePathSepForRegex('a\\\\b')).toBe('a\\\\b');
      expect(replacePathSepForRegex('a\\\\.dotfile')).toBe('a\\\\.dotfile');
    });

    // Confirming existing behavior; could be changed to improve cross-platform support
    it('should not replace escaped POSIX separators', () => {
      expect(replacePathSepForRegex('a\\/b')).toBe('a\\\\\\\\b');
    });

    // Bonus: Test cases from https://github.com/facebook/jest#5216
    it('should match the expected output from #5216', () => {
      expect(
        testPatternsFrom5216.map(replacePathSepForRegex),
      ).toMatchSnapshot();
    });
  });
});
