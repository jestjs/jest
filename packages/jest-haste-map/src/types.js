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

import type {SerializableError} from 'types/TestResult';
import type {InternalHasteMap, ModuleMetaData} from 'types/HasteMap';

export type IgnoreMatcher = (item: string) => boolean;

export type WorkerMessage = {
  filePath: string,
  hasteImplModulePath?: string,
};
export type WorkerMetadata = {
  id: ?string,
  module: ?ModuleMetaData,
  dependencies: ?Array<string>,
};
export type WorkerCallback = (
  error: ?SerializableError,
  metaData: ?WorkerMetadata,
) => void;

export type CrawlerOptions = {|
  data: InternalHasteMap,
  extensions: Array<string>,
  forceNodeFilesystemAPI: boolean,
  ignore: IgnoreMatcher,
  roots: Array<string>,
|};

export type HasteImpl = {
  getHasteName(filePath: string): (string | void),
}
