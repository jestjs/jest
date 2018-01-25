/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {WatchPlugin} from '../types';
import TestPathPatternPrompt from '../test_path_pattern_prompt';
import activeFilters from '../lib/active_filters_message';
import Prompt from '../lib/Prompt';

const PLUGIN_NAME = 'test-path-pattern';
const testPathPatternPlugin: WatchPlugin = {
  apply: (jestHooks, {stdin, stdout}) => {
    const showPrompt = (globalConfig, updateConfigAndRun) => {
      return new Promise((res, rej) => {
        let exited = false;
        const prompt = new Prompt();
        const testPathPatternPrompt = new TestPathPatternPrompt(stdout, prompt);

        stdin.on('data', (value, ...args) => {
          if (!exited) {
            prompt.put(value);
          }
        });

        testPathPatternPrompt.run(
          (value: string) => {
            exited = true;
            updateConfigAndRun({testPathPattern: value});
            res();
          },
          () => {
            exited = true;
            rej();
          },
          {
            header: activeFilters(globalConfig),
          },
        );
      });
    };

    jestHooks.showPrompt.tapPromise(PLUGIN_NAME, showPrompt);
  },
  key: 'p'.codePointAt(0),
  name: PLUGIN_NAME,
  prompt: 'filter by a filename regex pattern',
};

export default testPathPatternPlugin;
