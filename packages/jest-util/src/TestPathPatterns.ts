/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import {escapePathForRegex, replacePathSepForRegex} from 'jest-regex-util';

type PatternsConfig = {
  rootDir: string;
};

export default class TestPathPatterns {
  private _regexString: string | null = null;

  constructor(
    readonly patterns: Array<string>,
    private readonly config: PatternsConfig,
  ) {}

  static fromGlobalConfig(globalConfig: Config.GlobalConfig): TestPathPatterns {
    return new TestPathPatterns(globalConfig.testPathPatterns, globalConfig);
  }

  private get regexString(): string {
    if (this._regexString !== null) {
      return this._regexString;
    }

    const rootDir = this.config.rootDir.replace(/\/*$/, '/');
    const rootDirRegex = escapePathForRegex(rootDir);

    const regexString = this.patterns
      .map(p => {
        // absolute paths passed on command line should stay same
        if (p.match(/^\//)) {
          return p;
        }

        // explicit relative paths should resolve against rootDir
        if (p.match(/^\.\//)) {
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

  private get regex(): RegExp {
    return new RegExp(this.regexString, 'i');
  }

  /**
   * Return true if there are any patterns.
   */
  isSet(): boolean {
    return this.patterns.length > 0;
  }

  /**
   * Return true if the patterns form a valid regex.
   */
  isValid(): boolean {
    try {
      // @ts-expect-error noUnusedLocals
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = this.regex;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Return true if the given ABSOLUTE path matches the patterns.
   *
   * Throws an error if the patterns form an invalid regex (see `isValid`).
   */
  isMatch(path: string): boolean {
    return this.regex.test(path);
  }

  /**
   * Return a human-friendly version of the pattern regex.
   *
   * Does no normalization or anything, just a naive joining of the regex,
   * for simplicity.
   */
  toPretty(): string {
    const regex = this.patterns.map(p => p.replace(/\//g, '\\/')).join('|');
    return `/${regex}/i`;
  }
}
