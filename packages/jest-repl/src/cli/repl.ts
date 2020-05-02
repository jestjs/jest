/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare const jestGlobalConfig: Config.GlobalConfig;
declare const jestProjectConfig: Config.ProjectConfig;

import * as path from 'path';
import * as repl from 'repl';
import {runInThisContext} from 'vm';
import type {Transformer} from '@jest/transform';
import type {Config} from '@jest/types';

let transformer: Transformer;

const evalCommand: repl.REPLEval = (
  cmd: string,
  _context: any,
  _filename: string,
  callback: (e: Error | null, result?: any) => void,
) => {
  let result;
  try {
    if (transformer) {
      const transformResult = transformer.process(
        cmd,
        jestGlobalConfig.replname || 'jest.js',
        jestProjectConfig,
      );
      cmd =
        typeof transformResult === 'string'
          ? transformResult
          : transformResult.code;
    }
    result = runInThisContext(cmd);
  } catch (e) {
    return callback(isRecoverableError(e) ? new repl.Recoverable(e) : e);
  }
  return callback(null, result);
};

const isRecoverableError = (error: Error) => {
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

if (jestProjectConfig.transform) {
  let transformerPath = null;
  for (let i = 0; i < jestProjectConfig.transform.length; i++) {
    if (new RegExp(jestProjectConfig.transform[i][0]).test('foobar.js')) {
      transformerPath = jestProjectConfig.transform[i][1];
      break;
    }
  }
  if (transformerPath) {
    transformer = require(transformerPath);
    if (typeof transformer.process !== 'function') {
      throw new TypeError(
        'Jest: a transformer must export a `process` function.',
      );
    }
  }
}

const replInstance: repl.REPLServer = repl.start({
  eval: evalCommand,
  prompt: '\u203A ',
  useGlobal: true,
});

replInstance.context.require = (moduleName: string) => {
  if (/(\/|\\|\.)/.test(moduleName)) {
    moduleName = path.resolve(process.cwd(), moduleName);
  }
  return require(moduleName);
};
