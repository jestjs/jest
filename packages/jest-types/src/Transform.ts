/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// this is here to make it possible to avoid huge dependency trees just for types
export type TransformResult = {
  code: string;
  originalCode: string;
  mapCoverage?: boolean; // TODO - Remove in Jest 26
  sourceMapPath: string | null;
};
