/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pico from 'picocolors';
import type {Config} from '@jest/types';
import {isNonNullable} from 'jest-util';

const activeFilters = (globalConfig: Config.GlobalConfig): string => {
  const {testNamePattern} = globalConfig;
  const testPathPatterns = globalConfig.testPathPatterns;
  if (testNamePattern || testPathPatterns.isSet()) {
    const filters = [
      testPathPatterns.isSet()
        ? pico.dim('filename ') + pico.yellow(testPathPatterns.toPretty())
        : null,
      testNamePattern
        ? pico.dim('test name ') + pico.yellow(`/${testNamePattern}/`)
        : null,
    ]
      .filter(isNonNullable)
      .join(', ');

    const messages = `\n${pico.bold('Active Filters: ')}${filters}`;

    return messages;
  }

  return '';
};

export default activeFilters;
