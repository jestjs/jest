/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const relative = import.meta.resolve('./a.mjs?q=1#frag');
export const builtinEcho = import.meta.resolve('node:fs?q');
