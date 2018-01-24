jest.mock('path');

import {replacePathSepForRegex} from '../index';
import path from 'path';

describe('replacePathSepForRegex()', () => {
  describe('posix', () => {
    beforeEach(() => (path.sep = '/'));

    it('should return the path', () => {
      const expected = {};
      expect(replacePathSepForRegex(expected)).toBe(expected);
    });
  });

  describe('win32', () => {
    beforeEach(() => (path.sep = '\\'));

    it('should replace POSIX path separators', () => {
      expect(replacePathSepForRegex('a/b/c')).toBe('a\\\\b\\\\c');

      // When a regular expression is created with a string, not enclosing
      // slashes like "/<pattern>/", the "/" character does not need to be
      // escaped as "\/". The result is the double path separator: "\\"
      expect(replacePathSepForRegex('a\\/b')).toBe('a\\\\\\\\b');
    });

    it('should escape Windows path separators', () => {
      expect(replacePathSepForRegex('a\\b\\c')).toBe('a\\\\b\\\\c');
    });

    it('should not escape an escaped dot', () => {
      expect(replacePathSepForRegex('a\\.dotfile')).toBe('a\\.dotfile');

      // If we expect Windows path separators to be escaped, one would expect
      // the regular expression "\\\." to be unescaped as "\.". This is not the
      // current behavior.
      expect(replacePathSepForRegex('a\\\\\\.dotfile')).toBe(
        'a\\\\\\\\\\.dotfile',
      );
    });
  });
});
