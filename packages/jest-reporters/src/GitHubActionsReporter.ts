/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import stripAnsi = require('strip-ansi');
import type {Test, TestCaseResult} from '@jest/test-result';
import {
  formatPath,
  getStackTraceLines,
  getTopFrame,
  separateMessageFromStack,
} from 'jest-message-util';
import BaseReporter from './BaseReporter';

const errorTitleSeparator = ' \u203A ';

export default class GitHubActionsReporter extends BaseReporter {
  static readonly filename = __filename;

  override onTestCaseResult(
    _test: Test,
    {failureMessages, ancestorTitles, title}: TestCaseResult,
  ): void {
    failureMessages.forEach(failureMessage => {
      const {message, stack} = separateMessageFromStack(failureMessage);

      const stackLines = getStackTraceLines(stack);
      const normalizedStackLines = stackLines.map(line => formatPath(line));

      const topFrame = getTopFrame(stackLines);

      const errorTitle = [...ancestorTitles, title].join(errorTitleSeparator);
      const errorMessage = normalizeMessage(
        [message, ...normalizedStackLines].join('\n'),
      );

      this.log(
        `\n::error file=${topFrame?.file},line=${topFrame?.line},title=${errorTitle}::${errorMessage}`,
      );
    });
  }
}

function normalizeMessage(input: string): string {
  // copied from: https://github.com/actions/toolkit/blob/main/packages/core/src/command.ts
  const normalizedInput = input
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
  return stripAnsi(normalizedInput);
}
