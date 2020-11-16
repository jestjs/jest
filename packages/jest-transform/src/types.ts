/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {RawSourceMap} from 'source-map';
import type {Config, TransformTypes} from '@jest/types';

export type ShouldInstrumentOptions = Pick<
  Config.GlobalConfig,
  | 'collectCoverage'
  | 'collectCoverageFrom'
  | 'collectCoverageOnlyFrom'
  | 'coverageProvider'
> & {
  changedFiles?: Set<Config.Path>;
  sourcesRelatedToTestsInChangedFiles?: Set<Config.Path>;
};

export type Options = ShouldInstrumentOptions &
  Partial<{
    isCoreModule: boolean;
    isInternalModule: boolean;
  }> &
  CallerTransformOptions;

// This is fixed in source-map@0.7.x, but we can't upgrade yet since it's async
interface FixedRawSourceMap extends Omit<RawSourceMap, 'version'> {
  version: number;
}

// TODO: For Jest 26 normalize this (always structured data, never a string)
export type TransformedSource =
  | {code: string; map?: FixedRawSourceMap | string | null}
  | string;

export type TransformResult = TransformTypes.TransformResult;

export interface CallerTransformOptions {
  // names are copied from babel: https://babeljs.io/docs/en/options#caller
  supportsDynamicImport: boolean;
  supportsExportNamespaceFrom: boolean;
  supportsStaticESM: boolean;
  supportsTopLevelAwait: boolean;
}

export interface ReducedTransformOptions extends CallerTransformOptions {
  instrument: boolean;
}

export interface TransformOptions extends ReducedTransformOptions {
  config: Config.ProjectConfig;
  /** A stringified version of the configuration - useful in cache busting */
  configString: string;
}

export interface Transformer {
  canInstrument?: boolean;
  createTransformer?: (options?: unknown) => Transformer;

  getCacheKey?: (
    sourceText: string,
    sourcePath: Config.Path,
    options: TransformOptions,
  ) => string;

  process: (
    sourceText: string,
    sourcePath: Config.Path,
    options: TransformOptions,
  ) => TransformedSource;
}
