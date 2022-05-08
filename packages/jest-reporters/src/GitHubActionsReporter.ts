/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// import {relative} from 'path';
import {
  summary as actionsSummary,
  error as errorAnnotation,
} from '@actions/core';
import stripAnsi = require('strip-ansi');
import type {
  AggregatedResult,
  Test,
  TestCaseResult,
  TestContext,
} from '@jest/test-result';
import {
  formatPath,
  getStackTraceLines,
  getTopFrame,
  separateMessageFromStack,
} from 'jest-message-util';
import {pluralize} from 'jest-util';
import BaseReporter from './BaseReporter';

const ancestrySeparator = ' \u203A ';

export default class GitHubActionsReporter extends BaseReporter {
  static readonly filename = __filename;

  override onTestCaseResult(
    test: Test,
    {failureMessages, ancestorTitles, title}: TestCaseResult,
  ): void {
    failureMessages.forEach(failureMessage => {
      const {message, stack} = separateMessageFromStack(failureMessage);
      // const relativePath = relative(test.context.config.rootDir, test.path);

      const stackLines = getStackTraceLines(stack);
      const formattedLines = stackLines.map(line =>
        formatPath(line, test.context.config, null),
      );
      const topFrame = getTopFrame(stackLines);

      const errorTitle = [...ancestorTitles, title].join(ancestrySeparator);
      const errorMessage = stripAnsi([message, ...formattedLines].join('\n'));

      errorAnnotation(errorMessage, {
        file: test.path,
        startColumn: topFrame?.column,
        startLine: topFrame?.line,
        title: errorTitle,
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
}
