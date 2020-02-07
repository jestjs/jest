/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// this is in a separate file so that node 8 don't explode with a syntax error.
// Remove this file when we drop support for Node 8
export default (specifier: string): Promise<{default: unknown}> =>
  import(specifier);
