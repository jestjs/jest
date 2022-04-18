/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import slash = require('slash');

const BULLET = '\u25cf ';
const DOCUMENTATION_NOTE = `  ${chalk.bold(
  'Code Transformation Documentation:',
)}
  https://jestjs.io/docs/code-transformation
`;

export const makeInvalidReturnValueError = (): string =>
  chalk.red(
    [
      chalk.bold(`${BULLET}Invalid return value:`),
      "  Code transformer's `process` method must return an object containing `code` key ",
      '  with processed string. If `processAsync` method is implemented it must return ',
      '  a Promise resolving to an object containing `code` key with processed string.',
      '',
    ].join('\n') + DOCUMENTATION_NOTE,
  );

export const makeInvalidSourceMapWarning = (
  filename: string,
  transformPath: string,
): string =>
  chalk.yellow(
    [
      chalk.bold(`${BULLET}Invalid source map:`),
      `  The source map for "${slash(filename)}" returned by "${slash(
        transformPath,
      )}" is invalid.`,
      '  Proceeding without source mapping for that file.',
    ].join('\n'),
  );

export const makeInvalidSyncTransformerError = (
  transformPath: string,
): string =>
  chalk.red(
    [
      chalk.bold(`${BULLET}Invalid synchronous transformer module:`),
      `  "${slash(
        transformPath,
      )}" specified in the "transform" object of Jest configuration`,
      '  must export a `process` function.',
      '',
    ].join('\n') + DOCUMENTATION_NOTE,
  );

export const makeInvalidTransformerError = (transformPath: string): string =>
  chalk.red(
    [
      chalk.bold(`${BULLET}Invalid transformer module:`),
      `  "${slash(
        transformPath,
      )}" specified in the "transform" object of Jest configuration`,
      '  must export a `process` or `processAsync` or `createTransformer` function.',
      '',
    ].join('\n') + DOCUMENTATION_NOTE,
  );
