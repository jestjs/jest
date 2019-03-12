/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// capture global.Promise before it may potentially be overwritten
const Promise: any = global.Promise;

// see ES2015 spec 25.4.4.5, https://stackoverflow.com/a/38339199
const isPromise = (candidate: unknown): candidate is Promise<unknown> =>
  Promise.resolve(candidate) === candidate;
export default isPromise;
