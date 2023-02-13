/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// For some reason, doing `require`ing here works, while inside `cli` fails
export const VERSION = (
  require('../../package.json') as Record<string, unknown>
).version as string;
