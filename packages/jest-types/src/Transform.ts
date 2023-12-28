/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// this is here to make it possible to avoid huge dependency trees just for types
export type TransformResult = {
  code: string;
  originalCode: string;
  sourceMapPath: string | null;
};
