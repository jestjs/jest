/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import {buildIgnoreMatcher} from '../buildIgnoreMatcher';

const nodeModulesPath = path.join('/root', 'node_modules', 'pkg', 'index.js');
const normalPath = path.join('/root', 'src', 'index.js');

describe('buildIgnoreMatcher', () => {
  describe('ignorePattern', () => {
    it('returns true when RegExp matches', () => {
      const ignore = buildIgnoreMatcher(/Kiwi/, false);
      expect(ignore(path.join('/root', 'Kiwi.js'))).toBe(true);
    });

    it('returns false when RegExp does not match', () => {
      const ignore = buildIgnoreMatcher(/Kiwi/, false);
      expect(ignore(normalPath)).toBe(false);
    });

    it('returns true when function ignorePattern returns truthy', () => {
      const ignore = buildIgnoreMatcher(() => true, true);
      expect(ignore(normalPath)).toBe(true);
    });

    it('returns false when function ignorePattern returns falsy', () => {
      const ignore = buildIgnoreMatcher(() => false, true);
      expect(ignore(normalPath)).toBe(false);
    });

    it('returns false when ignorePattern is undefined', () => {
      const ignore = buildIgnoreMatcher(undefined, true);
      expect(ignore(normalPath)).toBe(false);
    });
  });

  describe('node_modules', () => {
    it('ignores node_modules when retainAllFiles is false', () => {
      const ignore = buildIgnoreMatcher(undefined, false);
      expect(ignore(nodeModulesPath)).toBe(true);
    });

    it('does not ignore node_modules when retainAllFiles is true', () => {
      const ignore = buildIgnoreMatcher(undefined, true);
      expect(ignore(nodeModulesPath)).toBe(false);
    });

    it('ignorePattern takes precedence over retainAllFiles for node_modules', () => {
      const ignore = buildIgnoreMatcher(/node_modules/, true);
      expect(ignore(nodeModulesPath)).toBe(true);
    });
  });
});
