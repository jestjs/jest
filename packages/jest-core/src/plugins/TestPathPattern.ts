/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import {
  BaseWatchPlugin,
  Prompt,
  UpdateConfigCallback,
  UsageData,
} from 'jest-watcher';
import TestPathPatternPrompt from '../TestPathPatternPrompt';
import activeFilters from '../lib/activeFiltersMessage';

class TestPathPatternPlugin extends BaseWatchPlugin {
  private readonly _prompt: Prompt;
  isInternal: true;

  constructor(options: {stdin: NodeJS.ReadStream; stdout: NodeJS.WriteStream}) {
    super(options);
    this._prompt = new Prompt();
    this.isInternal = true;
  }

  override getUsageInfo(): UsageData {
    return {
      key: 'p',
      prompt: 'filter by a filename regex pattern',
    };
  }

  override onKey(key: string): void {
    this._prompt.put(key);
  }

  override run(
    globalConfig: Config.GlobalConfig,
    updateConfigAndRun: UpdateConfigCallback,
  ): Promise<void> {
    return new Promise((res, rej) => {
      const testPathPatternPrompt = new TestPathPatternPrompt(
        this._stdout,
        this._prompt,
      );

      testPathPatternPrompt.run(
        (value: string) => {
          updateConfigAndRun({mode: 'watch', testPathPattern: value});
          res();
        },
        rej,
        {
          header: activeFilters(globalConfig),
        },
      );
    });
  }
}

export default TestPathPatternPlugin;
