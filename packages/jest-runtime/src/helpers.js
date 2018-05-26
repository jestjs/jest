// @flow
import chalk from 'chalk';

export const enhanceUnexpectedTokenMessage = (e: Error) => {
  e.stack =
    `${chalk.bold.red('Jest encountered an unexpected token')}

This usually means that you are trying to import a file which Jest cannot parse, e.g. it's not JavaScript.

Jest runs on source files, so it happens that it needs to process them with a transformer (${chalk.bold(
      '"transform"',
    )} option).
By default a transformer is not processing "node_modules" for performance reasons.
If you need to process some of your node modules please adjust the ${chalk.bold(
      '"transformIgnorePatterns"',
    )} option.

If you need to read non-JS files (e.g. binary assets), stubbing them out with ${chalk.bold(
      '"moduleNameMapper"',
    )} should help.

You'll find more details and examples of these config options in the docs:
${chalk.cyan('https://facebook.github.io/jest/docs/en/configuration.html')}

${chalk.bold.red('Details:')}

` + e.stack;

  return e;
};
