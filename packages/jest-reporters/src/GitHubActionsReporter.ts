/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {error as errorAnnotation} from '@actions/core';
import stripAnsi = require('strip-ansi');
import type {Test, TestCaseResult} from '@jest/test-result';
import {
  // formatPath,
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
    failureMessages.forEach(failureMessage => {
      const {message, stack} = separateMessageFromStack(failureMessage);

      const stackLines = getStackTraceLines(stack);
      // const formattedLines = stackLines.map(line =>
      //   formatPath(line, test.context.config, null),
      // );
      const topFrame = getTopFrame(stackLines);

      const errorTitle = [...ancestorTitles, title].join(errorTitleSeparator);
      let errorMessage = stripAnsi([message, ...stackLines].join('\n'));

      const rootDir = test.context.config.rootDir;
      const testPath = test.path;
      const cwd = process.cwd();

      errorMessage = `rootDir: ${rootDir} | testPath: ${testPath} | cwd: ${cwd}`;

      errorAnnotation(errorMessage, {
        file: test.path,
        startColumn: topFrame?.column,
        startLine: topFrame?.line,
        title: errorTitle,
      });
    });
  }
}
