/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Script} from 'vm';
import {Path, ProjectConfig} from './Config';

export type TransformedSource = {
  code: string;
  map?:  // copied from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/363cdf403a74e0372e87bbcd15eb1668f4c5230b/types/babel__core/index.d.ts#L371-L379
    | {
        version: number;
        sources: string[];
        names: string[];
        sourceRoot?: string;
        sourcesContent?: string[];
        mappings: string;
        file: string;
      }
    | string
    | null;
};

export type TransformResult = {
  script: Script;
  mapCoverage: boolean;
  sourceMapPath?: string;
};

export type TransformOptions = {
  instrument: boolean;
};

export type CacheKeyOptions = {
  config: ProjectConfig;
  instrument: boolean;
  rootDir: string;
};

export type Transformer = {
  canInstrument?: boolean;
  createTransformer?: (options: any) => Transformer;

  getCacheKey: (
    fileData: string,
    filePath: Path,
    configStr: string,
    options: CacheKeyOptions,
  ) => string;

  process: (
    sourceText: string,
    sourcePath: Path,
    config: ProjectConfig,
    options?: TransformOptions,
  ) => string | TransformedSource;
};
