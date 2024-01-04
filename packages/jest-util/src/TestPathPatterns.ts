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
        if (/^\//.test(p)) {
          return p;
        }

        // explicit relative paths should resolve against rootDir
        if (/^\.\//.test(p)) {
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
    return this.patterns.length > 0;
  }

  /**
   * Throw an error if the patterns don't form a valid regex.
   */
  validate(): void {
    this.toRegex();
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
    return this.patterns.join('|');
  }
}
