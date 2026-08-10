/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// copied from https://github.com/babel/babel/blob/56044c7851d583d498f919e9546caddf8f80a72f/packages/babel-helpers/src/helpers.js#L558-L562
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function interopRequireDefault(obj: any): any {
  return obj && obj.__esModule ? obj : {default: obj};
}
