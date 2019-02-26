/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Script} from 'vm';
import {RawSourceMap} from 'source-map';
import {Config} from '@jest/types';

export type ShouldInstrumentOptions = Pick<
  Config.GlobalConfig,
  'collectCoverage' | 'collectCoverageFrom' | 'collectCoverageOnlyFrom'
> & {
  changedFiles: Set<Config.Path> | undefined;
};

export type Options = ShouldInstrumentOptions &
  Pick<Config.GlobalConfig, 'extraGlobals'> & {
    isCoreModule?: boolean;
    isInternalModule?: boolean;
  };

// https://stackoverflow.com/a/48216010/1850276
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// This is fixed in a newer version, but that depends on Node 8 which is a
// breaking change (engine warning when installing)
interface FixedRawSourceMap extends Omit<RawSourceMap, 'version'> {
  version: number;
}

export type TransformedSource = {
  code: string;
  map?: FixedRawSourceMap | string | null;
};

export type TransformResult = {
  script: Script;
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

  getCacheKey: (
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
