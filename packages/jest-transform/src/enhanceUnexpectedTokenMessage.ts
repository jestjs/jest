/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import pc = require('picocolors');

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
  e.stack = `${pc.bold(pc.red('Jest encountered an unexpected token'))}

Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

By default "node_modules" folder is ignored by transformers.

Here's what you can do:
${DOT}If you are trying to use ECMAScript Modules, see ${pc.underline(
    'https://jestjs.io/docs/ecmascript-modules',
  )} for how to enable it.
${DOT}If you are trying to use TypeScript, see ${pc.underline(
    'https://jestjs.io/docs/getting-started#using-typescript',
  )}
${DOT}To have some of your "node_modules" files transformed, you can specify a custom ${pc.bold(
    '"transformIgnorePatterns"',
  )} in your config.
${DOT}If you need a custom transformation, specify a ${pc.bold(
    '"transform"',
  )} option in your config.
${DOT}If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the ${pc.bold(
    '"moduleNameMapper"',
  )} config option.

You'll find more details and examples of these config options in the docs:
${pc.cyan('https://jestjs.io/docs/configuration')}
For information about custom transformations, see:
${pc.cyan('https://jestjs.io/docs/code-transformation')}

${pc.bold(pc.red('Details:'))}

${e.stack ?? ''}`.trimEnd();

  return e;
}
