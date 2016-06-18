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

import type {Error} from 'types/TestResult';

export type IgnoreMatcher = (item: string) => boolean;

export type WorkerMessage = {
  filePath: string,
};
export type WorkerMetadata = {
  id: ?string,
  module: ?[string, number],
  dependencies: ?Array<string>,
};
export type WorkerCallback = (error: ?Error, metaData: ?WorkerMetadata) => void;
