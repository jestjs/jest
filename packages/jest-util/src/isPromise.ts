/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const isPromise = (candidate: unknown): candidate is PromiseLike<unknown> =>
  candidate != null &&
  (typeof candidate === 'object' || typeof candidate === 'function') &&
  typeof (candidate as any).then === 'function';
export default isPromise;
