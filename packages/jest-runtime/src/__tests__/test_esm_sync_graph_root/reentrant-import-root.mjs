/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {promise} from './reentrant-import.cjs';

globalThis.__reentrantRootEvaluations =
  (globalThis.__reentrantRootEvaluations ?? 0) + 1;

export const evaluations = globalThis.__reentrantRootEvaluations;
export const promiseFromCjs = promise;
export const marker = 'reentrant-root';
