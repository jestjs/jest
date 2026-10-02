/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import chalk from 'chalk';
import type {BufferedConsole, CustomConsole, NullConsole} from '@jest/console';
import type {JestEnvironment} from '@jest/environment';
import {pluralize} from 'jest-util';

export default function reportUnusedStubs(
  environment: JestEnvironment,
  testConsole: BufferedConsole | CustomConsole | NullConsole,
): void {
  const unusedStubs = environment.moduleMocker?.getUnusedStubs?.() ?? [];

  if (unusedStubs.length === 0) {
    return;
  }

  const stubs = unusedStubs.map(stub => `  - ${stub.getMockName()}`).join('\n');

  testConsole.warn(
    chalk.bold.yellow(
      `Warning: ${pluralize(
        'unused stub',
        unusedStubs.length,
      )} detected in this test file:\n\n${stubs}`,
    ),
  );
}
