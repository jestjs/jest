/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {escapePathForRegex, replacePathSepForRegex} from 'jest-regex-util';

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
  private _regexString: string | null = null;

  constructor(
    readonly patterns: TestPathPatterns,
    private readonly options: TestPathPatternsExecutorOptions,
  ) {}

  private get regexString(): string {
    if (this._regexString !== null) {
      return this._regexString;
    }

    const rootDir = this.options.rootDir.replace(/\/*$/, '/');
    const rootDirRegex = escapePathForRegex(rootDir);

    const regexString = this.patterns.patterns
      .map(p => {
        // absolute paths passed on command line should stay same
        if (p.startsWith('/')) {
          return p;
        }

        // explicit relative paths should resolve against rootDir
        if (p.startsWith('./')) {
          return p.replace(/^\.\//, rootDirRegex);
        }

        // all other patterns should only match the relative part of the test
        return `${rootDirRegex}(.*)?${p}`;
      })
      .map(replacePathSepForRegex)
      .join('|');

    this._regexString = regexString;
    return regexString;
  }

  private toRegex(): RegExp {
    return new RegExp(this.regexString, 'i');
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
      this.toRegex();
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
  isMatch(path: string): boolean {
    return this.toRegex().test(path);
  }

  /**
   * Return a human-friendly version of the pattern regex.
   */
  toPretty(): string {
    return this.patterns.toPretty();
  }
}
