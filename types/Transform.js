/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Path, ProjectConfig} from 'types/Config';
import type {Script} from 'vm';

export type TransformedSource = {|
  code: string,
  map: ?Object | string,
|};

export type TransformResult = {|
  script: Script,
  mapCoverage: boolean,
  sourceMapPath: ?string,
|};

export type TransformOptions = {|
  instrument: boolean,
|};

export type CacheKeyOptions = {|
  instrument: boolean,
  rootDir: string,
|};

export type Transformer = {|
  canInstrument?: boolean,
  createTransformer?: (options: any) => Transformer,

  getCacheKey: (
    fileData: string,
    filePath: Path,
    configStr: string,
    options: CacheKeyOptions,
  ) => string,

  process: (
    sourceText: string,
    sourcePath: Path,
    config: ProjectConfig,
    options?: TransformOptions,
  ) => string | TransformedSource,
|};
