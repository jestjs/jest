/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO: remove @jest/core exports for the next major
export {
  SearchSource,
  TestScheduler,
  TestWatcher,
  getVersion,
  runCLI,
} from '@jest/core';
export {run} from './cli';
