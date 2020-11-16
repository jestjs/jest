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
  // @ts-expect-error
  return (sourceText, sourcePath, configString, options) => {
    // Jest 27 passes a single options bag which contains `configString` rather than as a separate argument.
    // We can hide that API difference, though, so this module is usable for both jest@<27 and jest@>=27
    const inferredOptions: CacheKeyOptions = options || configString;
    const {config, instrument} = inferredOptions;

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
