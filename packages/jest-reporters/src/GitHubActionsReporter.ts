/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import stripAnsi = require('strip-ansi');
import type {
  AggregatedResult,
  TestContext,
  TestResult,
} from '@jest/test-result';
import BaseReporter from './BaseReporter';

const lineAndColumnInStackTrace = /^.*?:([0-9]+):([0-9]+).*$/;

function replaceEntities(s: string): string {
  // https://github.com/actions/toolkit/blob/b4639928698a6bfe1c4bdae4b2bfdad1cb75016d/packages/core/src/command.ts#L80-L85
  const substitutions: Array<[RegExp, string]> = [
    [/%/g, '%25'],
    [/\r/g, '%0D'],
    [/\n/g, '%0A'],
  ];
  return substitutions.reduce((acc, sub) => acc.replace(...sub), s);
}

export default class GitHubActionsReporter extends BaseReporter {
  static readonly filename = __filename;

  override onRunComplete(
    _testContexts?: Set<TestContext>,
    aggregatedResults?: AggregatedResult,
  ): void {
    const messages = getMessages(aggregatedResults?.testResults);

    for (const message of messages) {
      this.log(message);
    }
  }
}

function getMessages(results: Array<TestResult> | undefined) {
  if (!results) return [];

  return results.flatMap(({testFilePath, testResults}) =>
    testResults
      .filter(r => r.status === 'failed')
      .flatMap(r => r.failureMessages)
      .map(m => stripAnsi(m))
      .map(m => replaceEntities(m))
      .map(m => lineAndColumnInStackTrace.exec(m))
      .filter((m): m is RegExpExecArray => m !== null)
      .map(
        ([message, line, col]) =>
          `\n::error file=${testFilePath},line=${line},col=${col}::${message}`,
      ),
  );
}
