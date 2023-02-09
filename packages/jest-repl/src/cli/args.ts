/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Options} from 'yargs';

export const usage = 'Usage: $0 [--config=<pathToConfigFile>]';

const runtimeCLIOptions: Record<
  'cache' | 'config' | 'debug' | 'watchman',
  Options
> = {
  cache: {
    default: true,
    description:
      'Whether to use the preprocessor cache. Disable ' +
      'the cache using --no-cache.',
    type: 'boolean',
  },
  config: {
    alias: 'c',
    description: 'The path to a Jest config file.',
    type: 'string',
  },
  debug: {
    description: 'Print debugging info about your jest config.',
    type: 'boolean',
  },
  watchman: {
    default: true,
    description:
      'Whether to use watchman for file crawling. Disable using ' +
      '--no-watchman.',
    type: 'boolean',
  },
};

export const options: Record<string, Options> = {
  ...runtimeCLIOptions,
  replname: {
    alias: 'r',
    description:
      'The "name" of the file given to transformers to be ' +
      'transformed. For example, "repl.ts" if using a TypeScript transformer.',
    type: 'string',
  },
};
