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

const repl = require('repl');
const vm = require('vm');

/* global jestConfig */
declare var jestConfig: Object;
/* global jest */
declare var jest: Object;

let preprocessor;

function evalCommand(cmd, context, filename, callback, config) {
  let result;
  try {
    if (preprocessor) {
      cmd = preprocessor.process(
        cmd,
        jestConfig.replname || 'default.js',
        jestConfig
      );
    }
    result = vm.runInThisContext(cmd);
  } catch (e) {
    if (isRecoverableError(e)) {
      return callback(new repl.Recoverable(e));
    }
    return callback(e);
  }
  return callback(null, result);
}

function isRecoverableError(e) {
  if (e && e.name === 'SyntaxError') {
    const message = e.message;
    const exceptions = [
      'Unterminated template',
      'Missing } in template expression',
      'Unexpected end of input',
      'missing ) after argument list',
      'Unexpected token',
    ];

    return exceptions.some(exception => message.indexOf(exception) !== -1);
  }
  return false;
}

(() => {
  jest.disableAutomock();

  if (jestConfig.scriptPreprocessor) {
    // $FlowFixMe
    preprocessor = require(jestConfig.scriptPreprocessor);
    if (typeof preprocessor.process !== 'function') {
      throw new TypeError(
        'Jest: a preprocessor must export a `process` function.'
      );
    }
  }

  const replInstance = repl.start({
    prompt: '> ',
    useGlobal: true,
    eval: evalCommand,
  });

  // Use jest's module resolution within scripts
  replInstance.context.require = require;
})();
