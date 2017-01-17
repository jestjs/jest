/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const chalk = require('chalk');
const {ValidationError, format} = require('jest-validate');

const BULLET: string = chalk.bold('\u25cf');

const createCLIValidationError = (
  unrecognizedOptions: Array<string>,
  allowedOptions: Set<string>,
) => {
  let title = `${BULLET} Unrecognized CLI Parameter`;
  let message;
  const comment =
  `  ${chalk.bold('CLI Options Documentation')}:\n` +
  `  http://facebook.github.io/jest/docs/cli.html\n`;

  if (unrecognizedOptions.length === 1) {
    const leven = require('leven');
    const unrecognized = unrecognizedOptions[0];
    let suggestion;

    allowedOptions.forEach(option => {
      const steps = leven(option, unrecognized);
      if (steps < 3) {
        suggestion = option;
      }
    });

    message = `  Unrecognized option ${chalk.bold(format(unrecognized))}.`;
    if (suggestion) {
      message += ` Did you mean ${chalk.bold(format(suggestion))}?`;
    }
  } else {
    title += 's';
    message =
      `  Following options were not recognized by Jest:\n` +
      `  ${chalk.bold(format(unrecognizedOptions))}`;
  }

  return new ValidationError(title, message, comment);
};

const validateCLIOptions = (argv: Object, options: Object) => {
  const yargsSpecialOptions = ['$0', '_', 'help', 'h'];
  const allowedOptions = Object.keys(options).reduce((acc, option) =>
    acc
      .add(option)
      .add(options[option].alias || option),
    new Set(yargsSpecialOptions)
  );
  const unrecognizedOptions = Object.keys(argv).filter(arg => (
    !allowedOptions.has(arg)
  ));

  if (unrecognizedOptions.length) {
    throw createCLIValidationError(unrecognizedOptions, allowedOptions);
  }

  return true;
};

module.exports = validateCLIOptions;
