/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const unwrapped = {fromModuleExports: true};

export {unwrapped as 'module.exports'};
export const named = 'should-be-invisible-once-unwrapped';
