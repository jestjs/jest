/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import stripAnsi = require('strip-ansi');
import type {Test, TestResult} from '@jest/test-result';
import type {Config} from '@jest/types';
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

  onTestFileResult({context}: Test, {testResults}: TestResult): void {
    testResults.forEach(result => {
      const title = [...result.ancestorTitles, result.title].join(
        titleSeparator,
      );

      result.retryReasons?.forEach((retryReason, index) => {
        this.#createAnnotation({
          ...this.#getMessageDetails(retryReason, context.config),
          title: `RETRY ${index + 1}: ${title}`,
          type: 'warning',
        });
      });

      result.failureMessages.forEach(failureMessage => {
        this.#createAnnotation({
          ...this.#getMessageDetails(failureMessage, context.config),
          title,
          type: 'error',
        });
      });
    });
  }

  #getMessageDetails(failureMessage: string, config: Config.ProjectConfig) {
    const {message, stack} = separateMessageFromStack(failureMessage);

    const stackLines = getStackTraceLines(stack);
    const topFrame = getTopFrame(stackLines);

    const normalizedStackLines = stackLines.map(line =>
      formatPath(line, config),
    );
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
