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

const babel = require.call(null, 'babel-core');
const repl = require('repl');
const vm = require('vm');

const babelOptions = {
  // presets: ['react-native'],
};

function evalCommand(cmd, context, filename, callback) {
  var result;
  try {
    cmd = babel.transform(cmd, babelOptions).code;
    result = vm.runInThisContext(cmd);
  } catch (e) {
    if (isRecoverableError(e)) {
      return callback(new repl.Recoverable(e));
    }
    return callback(e);
  }
  callback(null, result);
}

function isRecoverableError(e) {
  if (e && e.name === 'SyntaxError') {
    var message = e.message;
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
  // Force module initialization before starting the repl, otherwise the first
  // command feels sluggish.
  babel.transform('', babelOptions);
  const replInstance = repl.start({
    prompt: '> ',
    useGlobal: true,
    eval: evalCommand,
  });
  // Use jest's module resolution within scripts
  replInstance.context.require = require;
})();
