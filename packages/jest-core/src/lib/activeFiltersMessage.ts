/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import type {Config} from '@jest/types';
import {isNonNullable} from 'jest-util';

const activeFilters = (globalConfig: Config.GlobalConfig): string => {
  const {testNamePattern, testPathPattern} = globalConfig;
  if (testNamePattern || testPathPattern) {
    const filters = [
      testPathPattern
        ? chalk.dim('filename ') + chalk.yellow(`/${testPathPattern}/`)
        : null,
      testNamePattern
        ? chalk.dim('test name ') + chalk.yellow(`/${testNamePattern}/`)
        : null,
    ]
      .filter(isNonNullable)
      .join(', ');

    const messages = `\n${chalk.bold('Active Filters: ')}${filters}`;

    return messages;
  }

  return '';
};

export default activeFilters;
