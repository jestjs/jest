/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

globalThis.afterEnvAsyncFunctionFinished = false;

module.exports = async () => {
  await new Promise(resolve =>
    setTimeout(() => {
      globalThis.afterEnvAsyncFunctionFinished = true;
      resolve();
    }, 2000),
  );
};
