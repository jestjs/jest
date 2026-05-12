/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {replacePathSepForRegex} from 'jest-regex-util';

export class TestPathPatterns {
  constructor(readonly patterns: Array<string>) {}

  /**
   * Return true if there are any patterns.
   */
  isSet(): boolean {
    return this.patterns.length > 0;
  }

  /**
   * Return true if the patterns are valid.
   */
  isValid(): boolean {
    return this.toExecutor({
      // isValid() doesn't require rootDir to be accurate, so just
      // specify a dummy rootDir here
      rootDir: '/',
    }).isValid();
  }

  /**
   * Return a human-friendly version of the pattern regex.
   */
  toPretty(): string {
    return this.patterns.join('|');
  }

  /**
   * Return a TestPathPatternsExecutor that can execute the patterns.
   */
  toExecutor(
    options: TestPathPatternsExecutorOptions,
  ): TestPathPatternsExecutor {
    return new TestPathPatternsExecutor(this, options);
  }

  /** For jest serializers */
  toJSON(): any {
    return {
      patterns: this.patterns,
      type: 'TestPathPatterns',
    };
  }
}

export type TestPathPatternsExecutorOptions = {
  rootDir: string;
};

export class TestPathPatternsExecutor {
  constructor(
    readonly patterns: TestPathPatterns,
    private readonly options: TestPathPatternsExecutorOptions,
  ) {}

  private toRegex(s: string): RegExp {
    return new RegExp(s, 'i');
  }

  /**
   * Return true if there are any patterns.
   */
  isSet(): boolean {
    return this.patterns.isSet();
  }

  /**
   * Return true if the patterns are valid.
   */
  isValid(): boolean {
    try {
      for (const p of this.patterns.patterns) {
        this.toRegex(p);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Return true if the given ABSOLUTE path matches the patterns.
   *
   * Throws an error if the patterns form an invalid regex (see `validate`).
   */
  isMatch(absPath: string): boolean {
    const relPath = path.relative(this.options.rootDir || '/', absPath);

    if (this.patterns.patterns.length === 0) {
      return true;
    }

    for (const p of this.patterns.patterns) {
      const pathToTest = path.isAbsolute(p) ? absPath : relPath;

      // special case: ./foo.spec.js (and .\foo.spec.js on Windows) should
      // match /^foo.spec.js/ after stripping root dir
      let regexStr = p.replace(/^\.\//, '^');
      if (path.sep === '\\') {
        regexStr = regexStr.replace(/^\.\\/, '^');
      }

      regexStr = replacePathSepForRegex(regexStr);
      if (this.toRegex(regexStr).test(pathToTest)) {
        return true;
      }

      if (this.toRegex(regexStr).test(absPath)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Return a human-friendly version of the pattern regex.
   */
  toPretty(): string {
    return this.patterns.toPretty();
  }
}
