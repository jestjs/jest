/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type {Path, ProjectConfig} from 'types/Config';
import type {Script} from 'vm';

export type TransformedSource = {|
  code: string,
  map: ?Object | string,
|};

export type BuiltTransformResult = {|
  script: Script,
  sourceMapPath: ?string,
|};

export type TransformOptions = {|
  instrument: boolean,
|};

export type Transformer = {|
  canInstrument?: boolean,
  createTransformer(options: any): Transformer,

  getCacheKey: (
    fileData: string,
    filePath: Path,
    configStr: string,
    options: TransformOptions,
  ) => string,

  process: (
    sourceText: string,
    sourcePath: Path,
    config: ProjectConfig,
    options?: TransformOptions,
  ) => string | TransformedSource,
|};
