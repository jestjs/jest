/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {RawSourceMap} from 'source-map';
import {Config} from '@jest/types';

export type ShouldInstrumentOptions = Pick<
  Config.GlobalConfig,
  'collectCoverage' | 'collectCoverageFrom' | 'collectCoverageOnlyFrom'
> & {changedFiles?: Set<Config.Path>};

export type Options = ShouldInstrumentOptions &
  Partial<{
    isCoreModule: boolean;
    isInternalModule: boolean;
  }>;

// This is fixed in source-map@0.7.x, but we can't upgrade yet since it's async
interface FixedRawSourceMap extends Omit<RawSourceMap, 'version'> {
  version: number;
}

export type TransformedSource = {
  code: string;
  map?: FixedRawSourceMap | string | null;
};

export type TransformResult = {
  code: string;
  mapCoverage: boolean;
  sourceMapPath: string | null;
};

export type TransformOptions = {
  instrument: boolean;
};

export type CacheKeyOptions = {
  config: Config.ProjectConfig;
  instrument: boolean;
  rootDir: string;
};

export interface Transformer {
  canInstrument?: boolean;
  createTransformer?: (options?: any) => Transformer;

  getCacheKey?: (
    fileData: string,
    filePath: Config.Path,
    configStr: string,
    options: CacheKeyOptions,
  ) => string;

  process: (
    sourceText: string,
    sourcePath: Config.Path,
    config: Config.ProjectConfig,
    options?: TransformOptions,
  ) => string | TransformedSource;
}
