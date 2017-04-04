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
 * 
 * @param {Number} reporterIndex specific index at which reporter is present
 * @param {any} reporterValue value of the reporter, anything output by the user
 * 
 * @returns {ValidationError} validation error which can be thrown if needed
 * 
 */
function createReporterError(
  reporterIndex: number,
  reporterValue: any,
): ValidationError {
  const errorMessage = `\tReporter at index ${reporterIndex} must be of type:\n` +
    `\t\t${chalk.bold.green(validReporterTypes.join(' or '))}\n` +
    `\tbut instead received:\n` +
    `\t\t${chalk.bold.red(getType(reporterValue))}`;

  return new ValidationError(ERROR, errorMessage, DOCUMENTATION_NOTE);
}

/**
 * createArrayReporterError
 * 
 * Reporter Error specific to Array configuration
 *
 * @param {Number} reporterIndex index for the given reporter config
 * @param {Number} valueIndex index of the 
 * @param {any} value value provided by the reporter
 * @param {any} expected expected value for the reporter
 *
 * @returns {ValidationError} ValidationError 
 */
function createArrayReporterError(
  reporterIndex: number,
  valueIndex: number,
  value: any,
  expected: any,
  valueName: string,
): ValidationError {
  const errorMessage = `\tUnexpected value for ${valueName} at index ${valueIndex} of reporter` +
    `at index ${reporterIndex}\n` +
    '\tExpected:\n' +
    `\t\t${chalk.bold.red(getType(expected))}\n` +
    '\tGot:\n' +
    `\t\t${chalk.bold.green(getType(value))}`;

  return new ValidationError(ERROR, errorMessage, DOCUMENTATION_NOTE);
}

/**
 * valiates the each reporter within the reporters
 * using appropriate values
 * 
 * @param {Array<any>} reporterConfig configuration for the given reporter
 * @returns {boolean} true if all the given reporters are valid
 */
function validateReporters(reporterConfig: Array<mixed>): boolean {
  return reporterConfig.every((reporter, index) => {
    if (Array.isArray(reporter)) {
      throw validateArrayReporter(reporter, index);
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
function validateArrayReporter(arrayReporter, reporterIndex) {
  const [path, options] = arrayReporter;
  if (typeof path !== 'string') {
    throw createArrayReporterError(reporterIndex, 0, path, '', 'Path');
  } else if (typeof options !== 'object') {
    throw createArrayReporterError(
      reporterIndex,
      1,
      options,
      {},
      'Reporter Configuration',
    );
  }
}

module.exports = {
  createArrayReporterError,
  createReporterError,
  validateReporters,
};
