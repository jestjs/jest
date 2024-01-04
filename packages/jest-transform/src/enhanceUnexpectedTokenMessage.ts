/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');

const DOT = ' \u2022 ';

interface ErrorWithCodeFrame extends Error {
  codeFrame?: string;
}

export default function handlePotentialSyntaxError(
  e: ErrorWithCodeFrame,
): ErrorWithCodeFrame {
  if (e.codeFrame != null) {
    e.stack = `${e.message}\n${e.codeFrame}`;
  }

  if (
    // `instanceof` might come from the wrong context
    e.name === 'SyntaxError' &&
    !e.message.includes(' expected')
  ) {
    throw enhanceUnexpectedTokenMessage(e);
  }

  return e;
}

export function enhanceUnexpectedTokenMessage(e: Error): Error {
  e.stack = `${chalk.bold.red('Jest encountered an unexpected token')}

Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

By default "node_modules" folder is ignored by transformers.

Here's what you can do:
${DOT}If you are trying to use ECMAScript Modules, see ${chalk.underline(
    'https://jestjs.io/docs/ecmascript-modules',
  )} for how to enable it.
${DOT}If you are trying to use TypeScript, see ${chalk.underline(
    'https://jestjs.io/docs/getting-started#using-typescript',
  )}
${DOT}To have some of your "node_modules" files transformed, you can specify a custom ${chalk.bold(
    '"transformIgnorePatterns"',
  )} in your config.
${DOT}If you need a custom transformation specify a ${chalk.bold(
    '"transform"',
  )} option in your config.
${DOT}If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the ${chalk.bold(
    '"moduleNameMapper"',
  )} config option.

You'll find more details and examples of these config options in the docs:
${chalk.cyan('https://jestjs.io/docs/configuration')}
For information about custom transformations, see:
${chalk.cyan('https://jestjs.io/docs/code-transformation')}

${chalk.bold.red('Details:')}

${e.stack ?? ''}`.trimEnd();

  return e;
}
