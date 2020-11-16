/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createHash} from 'crypto';
// eslint-disable-next-line no-restricted-imports
import {readFileSync} from 'fs';
import {relative} from 'path';
import type {Config} from '@jest/types';

// Should mirror `import('@jest/transform').TransformOptions`
type CacheKeyOptions = {
  config: Config.ProjectConfig;
  configString: string;
  instrument: boolean;
};

type GetCacheKeyFunction = (
  sourceText: string,
  sourcePath: Config.Path,
  options: CacheKeyOptions,
) => string;

function getGlobalCacheKey(files: Array<string>, values: Array<string>) {
  return [
    process.env.NODE_ENV,
    process.env.BABEL_ENV,
    ...values,
    ...files.map((file: string) => readFileSync(file)),
  ]
    .reduce(
      (hash, chunk) => hash.update('\0', 'utf8').update(chunk || ''),
      createHash('md5'),
    )
    .digest('hex');
}

function getCacheKeyFunction(globalCacheKey: string): GetCacheKeyFunction {
  return (sourceText, sourcePath, options) => {
    const {config, instrument} = options;
    return createHash('md5')
      .update(globalCacheKey)
      .update('\0', 'utf8')
      .update(sourceText)
      .update('\0', 'utf8')
      .update(config.rootDir ? relative(config.rootDir, sourcePath) : '')
      .update('\0', 'utf8')
      .update(instrument ? 'instrument' : '')
      .digest('hex');
  };
}

export default (
  files: Array<string> = [],
  values: Array<string> = [],
): GetCacheKeyFunction => getCacheKeyFunction(getGlobalCacheKey(files, values));
