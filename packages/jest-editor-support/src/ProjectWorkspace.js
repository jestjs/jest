/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

/**
 * Represents the project that the extension is running on and it's state
 */
module.exports = class ProjectWorkspace {
  /**
   * The path to the root of the project's workspace
   *
   * @type {string}
   */
  rootPath: string;

  /**
   * The path to Jest, this is normally a file path like
   * `node_modules/.bin/jest` but you should not make the assumption that
   * it is always a direct file path, as in a create-react app it would look
   * like `npm test --`.
   *
   * This means when launching a process, you will need to split on the first
   * space, and then move any other args into the args of the process.
   *
   * @type {string}
   */
  pathToJest: string;


  /**
   * Path to a local Jest config file.
   *
   * @type {string}
   */
  pathToConfig: string;

  /**
   * local Jest major release version, as the runner could run against
   * any version of Jest.
   *
   * @type {number}
   */
  localJestMajorVersion: number;

  constructor(
    rootPath: string,
    pathToJest: string,
    pathToConfig: string,
    localJestMajorVersion: number,
  ) {
    this.rootPath = rootPath;
    this.pathToJest = pathToJest;
    this.pathToConfig = pathToConfig;
    this.localJestMajorVersion = localJestMajorVersion;
  }
};
