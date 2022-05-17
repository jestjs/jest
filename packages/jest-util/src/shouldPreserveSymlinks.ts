/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// eslint-disable-next-line import/no-anonymous-default-export
export default (): boolean =>
  Boolean(process.env.NODE_PRESERVE_SYMLINKS) ||
  process.execArgv.includes('--preserve-symlinks');
