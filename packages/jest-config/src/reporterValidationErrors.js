/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
const {ValidationError} = require('jest-validate');
const {DOCUMENTATION_NOTE, BULLET} = require('./utils');

const chalk = require('chalk');
const {getType} = require('jest-matcher-utils');

const validReporterTypes = ['array', 'string'];
const ERROR = `${BULLET} Reporter Validation Error`;

/**
 * Reporter Vaidation Error is thrown if the given arguments
 * within the reporter are not valid
 * 
 * This is a highly specific reporter error and in the future will be
 * merged with jest-validate. Till then, we can make use of it. It works
 * and that's what counts most at this time
 */
function createReporterError(
  reporterIndex: number,
  reporterValue: any,
): ValidationError {
  const errorMessage = (
    `Reporter at index ${reporterIndex} must be of type:\n` +
    `   ${chalk.bold.green(validReporterTypes.join(' or '))}\n` +
    ` but instead received:\n` +
    `   ${chalk.bold.red(getType(reporterValue))}`
  );

  return new ValidationError(ERROR, errorMessage, DOCUMENTATION_NOTE);
}

/**
 * Reporter Error specific to Array configuration
 */
function createArrayReporterError(
  reporterIndex: number,
  valueIndex: number,
  value: any,
  expectedType: string,
  valueName: string,
): ValidationError {
  const errorMessage = (
    `Unexpected value for ${valueName} at index ${valueIndex} of reporter` +
    ` at index ${reporterIndex}\n` +
    ' Expected:\n' +
    `   ${chalk.bold.red(expectedType)}\n` +
    ' Got:\n' +
    `   ${chalk.bold.green(getType(value))}`
  );

  return new ValidationError(ERROR, errorMessage, DOCUMENTATION_NOTE);
}

/**
 * validates each reporter provided in the configuration
 * @private
 */
function validateReporters(reporterConfig: Array<mixed>): boolean {
  return reporterConfig.every((reporter, index) => {
    if (Array.isArray(reporter)) {
      validateArrayReporter(reporter, index);
    } else if (typeof reporter !== 'string') {
      throw createReporterError(index, reporter);
    }

    return true;
  });
}

/**
 * validates values within the array reporter
 * 
 * @param   {Array<mixed>} arrayReporter reporter to be validated
 * @returns {boolean} true if the reporter was validated
 */
function validateArrayReporter(
  arrayReporter: Array<mixed>,
  reporterIndex: number,
) {
  const [path, options] = arrayReporter;
  if (typeof path !== 'string') {
    throw createArrayReporterError(reporterIndex, 0, path, 'string', 'Path');
  } else if (typeof options !== 'object') {
    throw createArrayReporterError(
      reporterIndex,
      1,
      options,
      'object',
      'Reporter Configuration',
    );
  }
}

module.exports = {
  createArrayReporterError,
  createReporterError,
  validateReporters,
};
