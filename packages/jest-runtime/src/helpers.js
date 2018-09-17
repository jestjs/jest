// @flow
import chalk from 'chalk';
const DOT = ' \u2022 ';

export const enhanceUnexpectedTokenMessage = (e: Error) => {
  e.stack =
    `${chalk.bold.red('Jest encountered an unexpected token')}

This usually means that you are trying to import a file which Jest cannot parse, e.g. it's not plain JavaScript.

By default, if Jest sees a Babel config, it will use that to transform your files, ignoring "node_modules".

Here's what you can do:
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
${chalk.cyan('https://jestjs.io/docs/en/configuration.html')}

${chalk.bold.red('Details:')}

` + e.stack;

  return e;
};
