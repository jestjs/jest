/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable import-x/no-duplicates -- distinct query suffixes are distinct module instances */
import * as variantA from './cjs-dep.cjs?a';
import * as variantB from './cjs-dep.cjs?b';
/* eslint-enable import-x/no-duplicates */

export const distinctNamespaces = variantA !== variantB;
export const sharedExports = variantA.default === variantB.default;
