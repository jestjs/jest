/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createHash} from 'node:crypto';
// eslint-disable-next-line no-restricted-imports
import {readFileSync} from 'node:fs';
import {relative} from 'node:path';
import type {Config, TransformTypes} from '@jest/types';

type OldCacheKeyOptions = {
  config: Config.ProjectConfig;
  instrument: boolean;
};

type NewCacheKeyOptions = TransformTypes.CacheKeyOptions;

type OldGetCacheKeyFunction = (
  fileData: string,
  filePath: string,
  configStr: string,
  options: OldCacheKeyOptions,
) => string;

// Narrower than `Transformer['getCacheKey']`, which gets the full
// `TransformOptions`, and so stays assignable to it.
type NewGetCacheKeyFunction = (
  sourceText: string,
  sourcePath: string,
  options: NewCacheKeyOptions,
) => string;

type GetCacheKeyFunction = OldGetCacheKeyFunction & NewGetCacheKeyFunction;

const {NODE_ENV, BABEL_ENV} = process.env;

function getGlobalCacheKey(
  files: Array<string>,
  values: Array<string>,
  length: number,
) {
  return [
    NODE_ENV,
    BABEL_ENV,
    ...values,
    ...files.map((file: string) => readFileSync(file)),
  ]
    .reduce(
      (hash, chunk) => hash.update('\0', 'utf8').update(chunk || ''),
      createHash('sha1'),
    )
    .digest('hex')
    .slice(0, length);
}

// Missing before 27, which behaved as all-false.
function callerSupport(
  options: OldCacheKeyOptions | NewCacheKeyOptions,
): string {
  const support: Partial<TransformTypes.CallerTransformOptions> =
    'supportsStaticESM' in options ? options : {};
  const flags: Record<keyof TransformTypes.CallerTransformOptions, boolean> = {
    supportsDynamicImport: support.supportsDynamicImport === true,
    supportsExportNamespaceFrom: support.supportsExportNamespaceFrom === true,
    supportsStaticESM: support.supportsStaticESM === true,
    supportsTopLevelAwait: support.supportsTopLevelAwait === true,
  };

  return JSON.stringify(flags);
}

// Before 27 it is a separate argument rather than part of the bag.
function configStringOf(
  options: OldCacheKeyOptions | NewCacheKeyOptions,
): string {
  return 'configString' in options ? options.configString : '';
}

function getCacheKeyFunction(
  globalCacheKey: string,
  length: number,
): GetCacheKeyFunction {
  return ((sourceText, sourcePath, configString, options) => {
    // Jest 27 passes a single options bag which contains `configString` rather than as a separate argument.
    // We can hide that API difference, though, so this module is usable for both jest@<27 and jest@>=27
    const inferredOptions = options || configString;
    const {config, instrument} = inferredOptions;
    const inferredConfigString =
      typeof configString === 'string'
        ? configString
        : configStringOf(inferredOptions);

    return createHash('sha1')
      .update(globalCacheKey)
      .update('\0', 'utf8')
      .update(sourceText)
      .update('\0', 'utf8')
      .update(config.rootDir ? relative(config.rootDir, sourcePath) : '')
      .update('\0', 'utf8')
      .update(instrument ? 'instrument' : '')
      .update('\0', 'utf8')
      .update(inferredConfigString)
      .update('\0', 'utf8')
      .update(callerSupport(inferredOptions))
      .digest('hex')
      .slice(0, length);
  }) as GetCacheKeyFunction;
}

/**
 * Returns a function that can be used to generate cache keys based on source code of provided files and provided values.
 *
 * @param files - Array of absolute paths to files whose code should be accounted for when generating cache key
 * @param values - Array of string values that should be accounted for when generating cache key
 * @param length - Length of the resulting key. The default is `32`, or `16` on Windows.
 * @returns A function that can be used to generate cache keys.
 */
export default function createCacheKey(
  files: Array<string> = [],
  values: Array<string> = [],
  length = process.platform === 'win32' ? 16 : 32,
): GetCacheKeyFunction {
  return getCacheKeyFunction(getGlobalCacheKey(files, values, length), length);
}
