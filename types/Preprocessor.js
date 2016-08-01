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

import type {Config, Path} from 'types/Config';

export type PreprocessorOptions = {
  instrument: boolean,
};

export type Preprocessor = {
  INSTRUMENTS?: boolean,

  getCacheKey: (
    fileData: string,
    filePath: Path,
    configStr: string,
    options: PreprocessorOptions,
  ) => string,

  process: (
    sourceText: string,
    sourcePath: Path,
    config: Config,
    options?: PreprocessorOptions,
  ) => string,
};
