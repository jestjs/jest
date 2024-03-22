/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import slash = require('slash');

const BULLET = '\u25CF ';
const DOCUMENTATION_NOTE = `  ${chalk.bold(
  'Code Transformation Documentation:',
)}
  https://jestjs.io/docs/code-transformation
`;
const UPGRADE_NOTE = `  ${chalk.bold(
  'This error may be caused by a breaking change in Jest 28:',
)}
  https://jest-archive-august-2023.netlify.app/docs/28.x/upgrading-to-jest28#transformer
`;

export const makeInvalidReturnValueError = (transformPath: string): string =>
  chalk.red(
    [
      chalk.bold(`${BULLET}Invalid return value:`),
      '  `process()` or/and `processAsync()` method of code transformer found at ',
      `  "${slash(transformPath)}" `,
      '  should return an object or a Promise resolving to an object. The object ',
      '  must have `code` property with a string of processed code.',
      '',
    ].join('\n') +
      UPGRADE_NOTE +
      DOCUMENTATION_NOTE,
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
