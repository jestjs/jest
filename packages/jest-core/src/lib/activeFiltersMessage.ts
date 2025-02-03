/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pc from 'picocolors';
import type {Config} from '@jest/types';
import {isNonNullable} from 'jest-util';

const activeFilters = (globalConfig: Config.GlobalConfig): string => {
  const {testNamePattern} = globalConfig;
  const testPathPatterns = globalConfig.testPathPatterns;
  if (testNamePattern || testPathPatterns.isSet()) {
    const filters = [
      testPathPatterns.isSet()
        ? pc.dim('filename ') + pc.yellow(testPathPatterns.toPretty())
        : null,
      testNamePattern
        ? pc.dim('test name ') + pc.yellow(`/${testNamePattern}/`)
        : null,
    ]
      .filter(isNonNullable)
      .join(', ');

    const messages = `\n${pc.bold('Active Filters: ')}${filters}`;

    return messages;
  }

  return '';
};

export default activeFilters;
