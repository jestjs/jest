/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export declare const DIFF_COMMON = 0;
export declare const DIFF_DELETE = -1;
export declare const DIFF_INSERT = 1;

type DIFF_OP = 0 | -1 | 1;

export declare class Diff {
  constructor(op: DIFF_OP, substring: string);
  // properties have indexes like an array tuple
  0: DIFF_OP;
  1: string;
}

export declare const cleanupSemantic: (diffs: Array<Diff>) => void;
