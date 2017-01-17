/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const Console = require('./Console');
const FakeTimers = require('./FakeTimers');
const NullConsole = require('./NullConsole');
const {ValidationError, format} = require('jest-validate');

const {
  formatExecError,
  formatResultsErrors,
  formatStackTrace,
} = require('./messages');
const chalk = require('chalk');
const clearLine = require('./clearLine');
const fileExists = require('jest-file-exists');
const formatTestResults = require('./formatTestResults');
const installCommonGlobals = require('./installCommonGlobals');
const mkdirp = require('mkdirp');
const path = require('path');
const separateMessageFromStack = require('./separateMessageFromStack');
const setGlobal = require('./setGlobal');
const BULLET: string = chalk.bold('\u25cf');

const escapePathForRegex = (dir: string) => {
  if (path.sep === '\\') {
    // Replace "\" with "/" so it's not escaped by escapeStrForRegex.
    // replacePathSepForRegex will convert it back.
    dir = dir.replace(/\\/g, '/');
  }
  return replacePathSepForRegex(escapeStrForRegex(dir));
};

const escapeStrForRegex =
  (string: string) => string.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');

const replacePathSepForRegex = (string: string) => {
  if (path.sep === '\\') {
    return string.replace(/(\/|\\(?!\.))/g, '\\\\');
  }
  return string;
};

const createDirectory = (path: string) => {
  try {
    mkdirp.sync(path, '777');
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
};

const getPackageRoot = () => {
  const cwd = process.cwd();

  // Is the cwd somewhere within an npm package?
  let root = cwd;
  while (!fileExists(path.join(root, 'package.json'))) {
    if (root === '/' || root.match(/^[A-Z]:\\/)) {
      root = cwd;
      break;
    }
    root = path.resolve(root, '..');
  }

  return root;
};

const createCLIValidationError = (
  unrecognizedOptions: Array<string>,
  allowedOptions: Set<string>,
) => {
  let title = `${BULLET} Unrecognized CLI Parameter`;
  let message;
  const comment =
  `  ${chalk.bold('CLI Options Documentation')}:\n` +
  `  http://facebook.github.io/jest/docs/cli.html\n`;

  if (unrecognizedOptions.length === 1) {
    const leven = require('leven');
    const unrecognized = unrecognizedOptions[0];
    let suggestion;

    allowedOptions.forEach(option => {
      const steps = leven(option, unrecognized);
      if (steps < 3) {
        suggestion = option;
      }
    });

    message = `  Unrecognized option ${chalk.bold(format(unrecognized))}.`;
    if (suggestion) {
      message += ` Did you mean ${chalk.bold(format(suggestion))}?`;
    }
  } else {
    title += 's';
    message =
      `  Following options were not recognized by Jest:\n` +
      `  ${chalk.bold(format(unrecognizedOptions))}`;
  }

  return new ValidationError(title, message, comment);
};

const validateCLIOptions = (argv: Object, options: Object) => {
  const yargsSpecialOptions = ['$0', '_', 'help', 'h'];
  const allowedOptions = Object.keys(options).reduce((acc, option) =>
    acc
      .add(option)
      .add(options[option].alias || option),
    new Set(yargsSpecialOptions)
  );
  const unrecognizedOptions = Object.keys(argv).filter(arg => (
    !allowedOptions.has(arg)
  ));

  if (unrecognizedOptions.length) {
    throw createCLIValidationError(unrecognizedOptions, allowedOptions);
  }
};

module.exports = {
  Console,
  FakeTimers,
  NullConsole,
  clearLine,
  createDirectory,
  escapePathForRegex,
  escapeStrForRegex,
  formatExecError,
  formatResultsErrors,
  formatStackTrace,
  formatTestResults,
  getPackageRoot,
  installCommonGlobals,
  replacePathSepForRegex,
  separateMessageFromStack,
  setGlobal,
  validateCLIOptions,
};
