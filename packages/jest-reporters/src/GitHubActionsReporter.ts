/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {summary as actionsSummary} from '@actions/core';
import stripAnsi = require('strip-ansi');
import type {
  AggregatedResult,
  Test,
  TestContext,
  TestResult,
} from '@jest/test-result';
import type {Config} from '@jest/types';
import {
  formatPath,
  getStackTraceLines,
  getTopFrame,
  separateMessageFromStack,
} from 'jest-message-util';
import {pluralize} from 'jest-util';
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

  override async onRunComplete(
    _testContexts?: Set<TestContext>,
    result?: AggregatedResult,
  ): Promise<void> {
    if (!result?.numTotalTests) return;

    const summary = actionsSummary.addRaw('Jest ran ');
    if (result?.numTotalTestSuites) {
      const suitesCount = pluralize('test suite', result.numTotalTestSuites);
      summary.addRaw(`**${suitesCount}** with totally `);
    }
    if (result?.numTotalTests) {
      const testsCount = pluralize('test', result.numTotalTests);
      summary.addRaw(`**${testsCount}** `);
    }
    if (result?.snapshot.total) {
      const snapshotsCount = pluralize('snapshot', result.snapshot.total);
      summary.addRaw(`and matched **${snapshotsCount}** `);
    }
    if (result?.startTime) {
      const runTime = (Date.now() - result.startTime) / 1000;
      const duration = pluralize('second', Math.floor(runTime));
      summary.addRaw(`in just ${duration}.`, true);
    }

    const shieldColor = {
      failed: 'red',
      obsolete: 'yellow',
      passed: 'brightgreen',
      skipped: 'yellow',
      todo: 'blueviolet',
    };

    type GetBadgeOptions = {
      status: keyof typeof shieldColor;
      count?: number;
    };

    function getBadge({status, count = 0}: GetBadgeOptions) {
      if (count === 0) return;

      const src = `https://img.shields.io/badge/${status}-${count}-${shieldColor[status]}`;
      const alt = `${count} ${status}`;

      return `<img src="${src}" alt="${alt}">`;
    }

    summary.addTable([
      [
        {data: 'Test Suites', header: true},
        {data: 'Tests', header: true},
        {data: 'Snapshots', header: true},
      ],
      [
        [
          getBadge({count: result?.numFailedTestSuites, status: 'failed'}),
          getBadge({count: result?.numPendingTestSuites, status: 'skipped'}),
          getBadge({count: result?.numPassedTestSuites, status: 'passed'}),
        ]
          .filter(shield => shield !== undefined)
          .join('<br>'),

        [
          getBadge({count: result?.numFailedTests, status: 'failed'}),
          getBadge({count: result?.numPendingTests, status: 'skipped'}),
          getBadge({count: result?.numTodoTests, status: 'todo'}),
          getBadge({count: result?.numPassedTests, status: 'passed'}),
        ]
          .filter(shield => shield !== undefined)
          .join('<br>'),

        [
          getBadge({count: result?.snapshot.unmatched, status: 'failed'}),
          getBadge({count: result?.snapshot.unchecked, status: 'obsolete'}),
          getBadge({count: result?.snapshot.matched, status: 'passed'}),
        ]
          .filter(shield => shield !== undefined)
          .join('<br>'),
      ],
    ]);

    await summary.write();
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
