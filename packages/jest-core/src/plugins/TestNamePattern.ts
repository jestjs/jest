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
import TestNamePatternPrompt from '../TestNamePatternPrompt';
import activeFilters from '../lib/activeFiltersMessage';

class TestNamePatternPlugin extends BaseWatchPlugin {
  _prompt: Prompt;
  isInternal: true;

  constructor(options: {stdin: NodeJS.ReadStream; stdout: NodeJS.WriteStream}) {
    super(options);
    this._prompt = new Prompt();
    this.isInternal = true;
  }

  override getUsageInfo(): UsageData {
    return {
      key: 't',
      prompt: 'filter by a test name regex pattern',
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
      const testNamePatternPrompt = new TestNamePatternPrompt(
        this._stdout,
        this._prompt,
      );

      testNamePatternPrompt.run(
        (value: string) => {
          updateConfigAndRun({mode: 'watch', testNamePattern: value});
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

export default TestNamePatternPlugin;
