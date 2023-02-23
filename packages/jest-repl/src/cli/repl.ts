/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare const jestGlobalConfig: Config.GlobalConfig;
declare const jestProjectConfig: Config.ProjectConfig;

import * as path from 'path';
import * as repl from 'repl';
import * as util from 'util';
import {runInThisContext} from 'vm';
import type {SyncTransformer} from '@jest/transform';
import type {Config} from '@jest/types';
import {interopRequireDefault} from 'jest-util';

// TODO: support async as well
let transformer: SyncTransformer | undefined;
let transformerConfig: unknown;

const evalCommand: repl.REPLEval = (
  cmd: string,
  _context: unknown,
  _filename: string,
  callback: (e: Error | null, result?: unknown) => void,
) => {
  let result: unknown;
  try {
    if (transformer != null) {
      const transformResult = transformer.process(
        cmd,
        jestGlobalConfig.replname ?? 'jest.js',
        {
          cacheFS: new Map<string, string>(),
          config: jestProjectConfig,
          configString: JSON.stringify(jestProjectConfig),
          instrument: false,
          supportsDynamicImport: false,
          supportsExportNamespaceFrom: false,
          supportsStaticESM: false,
          supportsTopLevelAwait: false,
          transformerConfig,
        },
      );
      cmd =
        typeof transformResult === 'string'
          ? transformResult
          : transformResult.code;
    }
    result = runInThisContext(cmd) as unknown;
  } catch (e: any) {
    return callback(isRecoverableError(e) ? new repl.Recoverable(e) : e);
  }
  return callback(null, result);
};

const isRecoverableError = (error: unknown) => {
  if (!util.types.isNativeError(error)) {
    return false;
  }

  if (error.name === 'SyntaxError') {
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
      transformerConfig = jestProjectConfig.transform[i][2];
      break;
    }
  }
  if (transformerPath != null) {
    const transformerOrFactory = interopRequireDefault(
      require(transformerPath),
    ).default;

    if (typeof transformerOrFactory.createTransformer === 'function') {
      transformer = transformerOrFactory.createTransformer(transformerConfig);
    } else {
      transformer = transformerOrFactory;
    }

    if (typeof transformer?.process !== 'function') {
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
  return require(moduleName) as unknown;
};
