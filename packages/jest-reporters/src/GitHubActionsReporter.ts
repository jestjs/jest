/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {relative} from 'path';
import slash = require('slash');
import stripAnsi = require('strip-ansi');
import type {Test, TestCaseResult} from '@jest/test-result';
import {
  getStackTraceLines,
  getTopFrame,
  separateMessageFromStack,
} from 'jest-message-util';
import BaseReporter from './BaseReporter';

const errorTitleSeparator = ' \u203A ';

export default class GitHubActionsReporter extends BaseReporter {
  static readonly filename = __filename;

  override onTestCaseResult(
    test: Test,
    {failureMessages, ancestorTitles, title}: TestCaseResult,
  ): void {
    failureMessages.forEach(failure => {
      const {message, stack} = separateMessageFromStack(stripAnsi(failure));

      const relativeTestPath = slash(relative('', test.path));
      const stackLines = getStackTraceLines(stack);
      const normalizedStackLines = stackLines.map(line =>
        line.replace(test.path, relativeTestPath),
      );

      const topFrame = getTopFrame(stackLines);

      const errorTitle = [...ancestorTitles, title].join(errorTitleSeparator);
      const errorMessage = normalizeMessage(
        [message, ...normalizedStackLines].join('\n'),
      );

      this.log(
        `\n::error file=${test.path},line=${topFrame?.line},title=${errorTitle}::${errorMessage}`,
      );
    });
  }
}

// copied from: https://github.com/actions/toolkit/blob/main/packages/core/src/command.ts
function normalizeMessage(input: string): string {
  return input.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}
