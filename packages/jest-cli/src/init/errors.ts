/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class NotFoundPackageJsonError extends Error {
  constructor(rootDir: string) {
    super(`Could not find a "package.json" file in ${rootDir}`);
    this.name = '';
    Error.captureStackTrace(this, () => {});
  }
}

export class MalformedPackageJsonError extends Error {
  constructor(packageJsonPath: string) {
    super(
      `There is malformed json in ${packageJsonPath}\n` +
        'Fix it, and then run "jest --init"',
    );
    this.name = '';
    Error.captureStackTrace(this, () => {});
  }
}
