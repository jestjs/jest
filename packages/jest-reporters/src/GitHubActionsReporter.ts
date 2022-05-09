/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import stripAnsi = require('strip-ansi');
import type {Test, TestResult} from '@jest/test-result';
import {
  formatPath,
  getStackTraceLines,
  getTopFrame,
  separateMessageFromStack,
} from 'jest-message-util';
import BaseReporter from './BaseReporter';

type AnnotationOptions = {
  file?: string;
  line?: number | string;
  message: string;
  title: string;
  type: 'error' | 'warning';
};

const titleSeparator = ' \u203A ';

export default class GitHubActionsReporter extends BaseReporter {
  static readonly filename = __filename;

  onTestFileResult(test: Test, {testResults}: TestResult): void {
    testResults.forEach(result => {
      const title = [...result.ancestorTitles, result.title].join(
        titleSeparator,
      );

      result.failureMessages.forEach(failureMessage => {
        this.#createAnnotation({
          ...this.#getMessageDetails(failureMessage),
          title,
          type: 'error',
        });
      });

      result.retryReasons?.forEach((retryReason, index) => {
        this.#createAnnotation({
          ...this.#getMessageDetails(retryReason),
          title: `[RETRY ${index + 1}] ${title} | rootDir ${
            test.context.config.rootDir
          }`,
          type: 'warning',
        });
      });
    });
  }

  #getMessageDetails(failureMessage: string) {
    const {message, stack} = separateMessageFromStack(failureMessage);

    const stackLines = getStackTraceLines(stack);
    const topFrame = getTopFrame(stackLines);

    const normalizedStackLines = stackLines.map(line => formatPath(line));
    const messageText = [message, ...normalizedStackLines].join('\n');

    return {
      file: topFrame?.file,
      line: topFrame?.line,
      message: messageText,
    };
  }

  #createAnnotation({file, line, message, title, type}: AnnotationOptions) {
    message = stripAnsi(
      // copied from: https://github.com/actions/toolkit/blob/main/packages/core/src/command.ts
      message.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A'),
    );

    this.log(
      `\n::${type} file=${file},line=${line},title=${title}::${message}`,
    );
  }
}
