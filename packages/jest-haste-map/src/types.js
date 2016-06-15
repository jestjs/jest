/**
* Copyright (c) 2015-present, Facebook, Inc.
* All rights reserved.
*
* @flow
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*/
'use strict';

export type IgnoreMatcher = (item: string) => boolean;

export type WorkerMessage = {
  filePath: string,
};
export type WorkerMetadata = {
  id: ?string,
  module: ?[string, number],
  dependencies: ?Array<string>,
};
export type WorkerCallback = (err: ?Error, metaData: ?WorkerMetadata) => void;
