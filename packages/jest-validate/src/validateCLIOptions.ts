/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import camelcase = require('camelcase');
import chalk = require('chalk');
import type {Options} from 'yargs';
import type {Config} from '@jest/types';
import type {
  DeprecatedOptionFunc,
  DeprecatedOptions,
  DeprecationItem,
} from './types';
import {
  ValidationError,
  createDidYouMeanMessage,
  format,
  logValidationWarning,
} from './utils';

const BULLET: string = chalk.bold('\u25CF');
export const DOCUMENTATION_NOTE = `  ${chalk.bold('CLI Options Documentation:')}
  https://jestjs.io/docs/cli
`;

const createCLIValidationError = (
  unrecognizedOptions: Array<string>,
  allowedOptions: Set<string>,
) => {
  let title = `${BULLET} Unrecognized CLI Parameter`;
  let message;
  const comment =
    `  ${chalk.bold('CLI Options Documentation')}:\n` +
    '  https://jestjs.io/docs/cli\n';

  if (unrecognizedOptions.length === 1) {
    const unrecognized = unrecognizedOptions[0];
    const didYouMeanMessage =
      unrecognized.length > 1
        ? createDidYouMeanMessage(unrecognized, [...allowedOptions])
        : '';
    message = `  Unrecognized option ${chalk.bold(format(unrecognized))}.${
      didYouMeanMessage ? ` ${didYouMeanMessage}` : ''
    }`;
  } else {
    title += 's';
    message =
      '  Following options were not recognized:\n' +
      `  ${chalk.bold(format(unrecognizedOptions))}`;
  }

  return new ValidationError(title, message, comment);
};

const validateDeprecatedOptions = (
  deprecatedOptions: Array<DeprecationItem>,
  deprecationEntries: DeprecatedOptions,
  argv: Config.Argv,
) => {
  for (const opt of deprecatedOptions) {
    const name = opt.name;
    const message = deprecationEntries[name](argv);
    const comment = DOCUMENTATION_NOTE;

    if (opt.fatal) {
      throw new ValidationError(name, message, comment);
    } else {
      logValidationWarning(name, message, comment);
    }
  }
};

export default function validateCLIOptions(
  argv: Config.Argv,
  options: Record<string, Options> & {
    deprecationEntries?: DeprecatedOptions;
  } = {},
  rawArgv: Array<string> = [],
): boolean {
  const yargsSpecialOptions = ['$0', '_', 'help', 'h'];

  const allowedOptions = Object.keys(options).reduce(
    (acc, option) =>
      acc.add(option).add((options[option].alias as string) || option),
    new Set(yargsSpecialOptions),
  );

  const deprecationEntries = options.deprecationEntries ?? {};
  const CLIDeprecations = Object.keys(deprecationEntries).reduce<
    Record<string, DeprecatedOptionFunc>
  >((acc, entry) => {
    acc[entry] = deprecationEntries[entry];
    if (options[entry]) {
      const alias = options[entry].alias as string;
      if (alias) {
        acc[alias] = deprecationEntries[entry];
      }
    }
    return acc;
  }, {});
  const deprecations = new Set(Object.keys(CLIDeprecations));
  const deprecatedOptions = Object.keys(argv)
    .filter(arg => deprecations.has(arg) && argv[arg] != null)
    .map(arg => ({fatal: !allowedOptions.has(arg), name: arg}));

  if (deprecatedOptions.length > 0) {
    validateDeprecatedOptions(deprecatedOptions, CLIDeprecations, argv);
  }

  const unrecognizedOptions = Object.keys(argv).filter(
    arg =>
      !allowedOptions.has(camelcase(arg, {locale: 'en-US'})) &&
      !allowedOptions.has(arg) &&
      (rawArgv.length === 0 || rawArgv.includes(arg)),
  );

  if (unrecognizedOptions.length > 0) {
    throw createCLIValidationError(unrecognizedOptions, allowedOptions);
  }

  return true;
}
