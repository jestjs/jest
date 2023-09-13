/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class NotFoundPackageJsonError extends Error {
  constructor(rootDir: string) {
    super(`Could not find a "package.json" file in ${rootDir}`);
    this.name = '';
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    Error.captureStackTrace(this, () => {});
  }
}

export class MalformedPackageJsonError extends Error {
  constructor(packageJsonPath: string) {
    super(`There is malformed json in ${packageJsonPath}`);
    this.name = '';
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    Error.captureStackTrace(this, () => {});
  }
}
