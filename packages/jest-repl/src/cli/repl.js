/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

declare var jestConfig: Object;
declare var jest: Object;

jest.disableAutomock();

const chalk = require('chalk');
const path = require('path');
const repl = require('repl');
const vm = require('vm');

let preprocessor;

const evalCommand = (cmd, context, filename, callback, config) => {
  let result;
  try {
    if (preprocessor) {
      cmd = preprocessor.process(
        cmd,
        jestConfig.replname || 'jest.js',
        jestConfig
      );
    }
    result = vm.runInThisContext(cmd);
  } catch (e) {
    return callback(isRecoverableError(e) ? new repl.Recoverable(e) : e);
  }
  return callback(null, result);
};

const isRecoverableError = error => {
  if (error && error.name === 'SyntaxError') {
    return [
      'Unterminated template',
      'Missing } in template expression',
      'Unexpected end of input',
      'missing ) after argument list',
      'Unexpected token',
    ].some(exception => error.message.includes(exception));
  }
  return false;
};

if (jestConfig.scriptPreprocessor) {
  /* $FlowFixMe */
  preprocessor = require(jestConfig.scriptPreprocessor);
  if (typeof preprocessor.process !== 'function') {
    throw new TypeError(
      'Jest: a preprocessor must export a `process` function.'
    );
  }
}

const replInstance = repl.start({
  prompt: chalk.green('\u203A') + ' ',
  useGlobal: true,
  eval: evalCommand,
});

replInstance.context.require = moduleName => {
  if (/(\/|\\|\.)/.test(moduleName)) {
    moduleName = path.resolve(process.cwd(), moduleName);
  }
  /* $FlowFixMe */
  return require(moduleName);
};
