/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import chalk from 'chalk';
import ansiEscapes from 'ansi-escapes';
import {AggregatedResult, AssertionLocation} from '@jest/test-result';
import {KEYS} from 'jest-watcher';
import {pluralize, specialChars} from 'jest-util';

const {ARROW, CLEAR} = specialChars;

export default class SnapshotInteractiveMode {
  private _pipe: NodeJS.WritableStream;
  private _isActive: boolean;
  private _updateTestRunnerConfig!: (
    assertion: AssertionLocation | null,
    shouldUpdateSnapshot: boolean,
  ) => unknown;
  private _testAssertions!: Array<AssertionLocation>;
  private _countPaths!: number;
  private _skippedNum: number;

  constructor(pipe: NodeJS.WritableStream) {
    this._pipe = pipe;
    this._isActive = false;
    this._skippedNum = 0;
  }

  isActive() {
    return this._isActive;
  }

  getSkippedNum() {
    return this._skippedNum;
  }

  private _clearTestSummary() {
    this._pipe.write(ansiEscapes.cursorUp(6));
    this._pipe.write(ansiEscapes.eraseDown);
  }

  private _drawUIProgress() {
    this._clearTestSummary();
    const numPass = this._countPaths - this._testAssertions.length;
    const numRemaining = this._countPaths - numPass - this._skippedNum;

    let stats = chalk.bold.dim(
      pluralize('snapshot', numRemaining) + ' remaining',
    );
    if (numPass) {
      stats +=
        ', ' + chalk.bold.green(pluralize('snapshot', numPass) + ' updated');
    }
    if (this._skippedNum) {
      stats +=
        ', ' +
        chalk.bold.yellow(pluralize('snapshot', this._skippedNum) + ' skipped');
    }
    const messages = [
      '\n' + chalk.bold('Interactive Snapshot Progress'),
      ARROW + stats,
      '\n' + chalk.bold('Watch Usage'),

      chalk.dim(ARROW + 'Press ') +
        'u' +
        chalk.dim(' to update failing snapshots for this test.'),

      chalk.dim(ARROW + 'Press ') +
        's' +
        chalk.dim(' to skip the current test.'),

      chalk.dim(ARROW + 'Press ') +
        'q' +
        chalk.dim(' to quit Interactive Snapshot Mode.'),

      chalk.dim(ARROW + 'Press ') +
        'Enter' +
        chalk.dim(' to trigger a test run.'),
    ];

    this._pipe.write(messages.filter(Boolean).join('\n') + '\n');
  }

  private _drawUIDoneWithSkipped() {
    this._pipe.write(CLEAR);
    const numPass = this._countPaths - this._testAssertions.length;

    let stats = chalk.bold.dim(
      pluralize('snapshot', this._countPaths) + ' reviewed',
    );
    if (numPass) {
      stats +=
        ', ' + chalk.bold.green(pluralize('snapshot', numPass) + ' updated');
    }
    if (this._skippedNum) {
      stats +=
        ', ' +
        chalk.bold.yellow(pluralize('snapshot', this._skippedNum) + ' skipped');
    }
    const messages = [
      '\n' + chalk.bold('Interactive Snapshot Result'),
      ARROW + stats,
      '\n' + chalk.bold('Watch Usage'),

      chalk.dim(ARROW + 'Press ') +
        'r' +
        chalk.dim(' to restart Interactive Snapshot Mode.'),

      chalk.dim(ARROW + 'Press ') +
        'q' +
        chalk.dim(' to quit Interactive Snapshot Mode.'),
    ];

    this._pipe.write(messages.filter(Boolean).join('\n') + '\n');
  }

  private _drawUIDone() {
    this._pipe.write(CLEAR);
    const numPass = this._countPaths - this._testAssertions.length;

    let stats = chalk.bold.dim(
      pluralize('snapshot', this._countPaths) + ' reviewed',
    );
    if (numPass) {
      stats +=
        ', ' + chalk.bold.green(pluralize('snapshot', numPass) + ' updated');
    }
    const messages = [
      '\n' + chalk.bold('Interactive Snapshot Result'),
      ARROW + stats,
      '\n' + chalk.bold('Watch Usage'),

      chalk.dim(ARROW + 'Press ') +
        'Enter' +
        chalk.dim(' to return to watch mode.'),
    ];

    this._pipe.write(messages.filter(Boolean).join('\n') + '\n');
  }

  private _drawUIOverlay() {
    if (this._testAssertions.length === 0) {
      return this._drawUIDone();
    }

    if (this._testAssertions.length - this._skippedNum === 0) {
      return this._drawUIDoneWithSkipped();
    }

    return this._drawUIProgress();
  }

  put(key: string) {
    switch (key) {
      case 's':
        if (this._skippedNum === this._testAssertions.length) break;
        this._skippedNum += 1;

        // move skipped test to the end
        this._testAssertions.push(this._testAssertions.shift()!);
        if (this._testAssertions.length - this._skippedNum > 0) {
          this._run(false);
        } else {
          this._drawUIDoneWithSkipped();
        }

        break;
      case 'u':
        this._run(true);
        break;
      case 'q':
      case KEYS.ESCAPE:
        this.abort();
        break;
      case 'r':
        this.restart();
        break;
      case KEYS.ENTER:
        if (this._testAssertions.length === 0) {
          this.abort();
        } else {
          this._run(false);
        }
        break;
      default:
        break;
    }
  }

  abort() {
    this._isActive = false;
    this._skippedNum = 0;
    this._updateTestRunnerConfig(null, false);
  }

  restart() {
    this._skippedNum = 0;
    this._countPaths = this._testAssertions.length;
    this._run(false);
  }

  updateWithResults(results: AggregatedResult) {
    const hasSnapshotFailure = !!results.snapshot.failure;
    if (hasSnapshotFailure) {
      this._drawUIOverlay();
      return;
    }

    this._testAssertions.shift();
    if (this._testAssertions.length - this._skippedNum === 0) {
      this._drawUIOverlay();
      return;
    }

    // Go to the next test
    this._run(false);
  }

  private _run(shouldUpdateSnapshot: boolean) {
    const testAssertion = this._testAssertions[0];
    this._updateTestRunnerConfig(testAssertion, shouldUpdateSnapshot);
  }

  run(
    failedSnapshotTestAssertions: Array<AssertionLocation>,
    onConfigChange: (
      assertion: AssertionLocation | null,
      shouldUpdateSnapshot: boolean,
    ) => unknown,
  ) {
    if (!failedSnapshotTestAssertions.length) {
      return;
    }

    this._testAssertions = [...failedSnapshotTestAssertions];
    this._countPaths = this._testAssertions.length;
    this._updateTestRunnerConfig = onConfigChange;
    this._isActive = true;
    this._run(false);
  }
}
