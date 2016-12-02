// @flow
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

  constructor(rootPath: string, pathToJest: string) {
    this.rootPath = rootPath;
    this.pathToJest = pathToJest;
  }
};
