import ansiEscapes = require('ansi-escapes');
import chalk = require('chalk');
import type {AggregatedResult, AssertionLocation} from '@jest/test-result';
import {pluralize, specialChars} from 'jest-util';
import {KEYS} from 'jest-watcher';

type RunnerUpdateFunction = (failure?: AssertionLocation) => void;

const {ARROW, CLEAR} = specialChars;

function describeKey(key: string, description: string) {
  return `${chalk.dim(ARROW + 'Press')} ${key} ${chalk.dim(description)}`;
}

const TestProgressLabel = chalk.bold('Interactive Test Progress');

export default class FailedTestsInteractiveMode {
  private _isActive = false;
  private _countPaths = 0;
  private _skippedNum = 0;
  private _testAssertions: Array<AssertionLocation> = [];
  private _updateTestRunnerConfig?: RunnerUpdateFunction;

  constructor(private _pipe: NodeJS.WritableStream) {}

  isActive(): boolean {
    return this._isActive;
  }

  put(key: string): void {
    switch (key) {
      case 's':
        if (this._skippedNum === this._testAssertions.length) break;

        this._skippedNum += 1;
        // move skipped test to the end
        this._testAssertions.push(this._testAssertions.shift()!);
        if (this._testAssertions.length - this._skippedNum > 0) {
          this._run();
        } else {
          this._drawUIDoneWithSkipped();
        }

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
          this._run();
        }
        break;
      default:
    }
  }

  run(
    failedSnapshotTestAssertions: Array<AssertionLocation>,
    updateConfig: RunnerUpdateFunction,
  ): void {
    if (!failedSnapshotTestAssertions.length) return;

    this._testAssertions = [...failedSnapshotTestAssertions];
    this._countPaths = this._testAssertions.length;
    this._updateTestRunnerConfig = updateConfig;
    this._isActive = true;
    this._run();
  }

  updateWithResults(results: AggregatedResult): void {
    if (!results.snapshot.failure && results.numFailedTests) {
      return this._drawUIOverlay();
    }

    this._testAssertions.shift();
    if (this._testAssertions.length === 0) {
      return this._drawUIOverlay();
    }

    // Go to the next test
    return this._run();
  }

  private _clearTestSummary() {
    this._pipe.write(ansiEscapes.cursorUp(6));
    this._pipe.write(ansiEscapes.eraseDown);
  }

  private _drawUIDone() {
    this._pipe.write(CLEAR);

    const messages: Array<string> = [
      chalk.bold('Watch Usage'),
      describeKey('Enter', 'to return to watch mode.'),
    ];

    this._pipe.write(messages.join('\n') + '\n');
  }

  private _drawUIDoneWithSkipped() {
    this._pipe.write(CLEAR);

    let stats = `${pluralize('test', this._countPaths)} reviewed`;

    if (this._skippedNum) {
      const skippedText = chalk.bold.yellow(
        pluralize('snapshot', this._skippedNum) + ' skipped',
      );

      stats = `${stats}, ${skippedText}`;
    }

    const message = [
      TestProgressLabel,
      `${ARROW}${stats}`,
      '\n',
      chalk.bold('Watch Usage'),
      describeKey('r', 'to restart Interactive Mode.'),
      describeKey('q', 'to quit Interactive Mode.'),
      describeKey('Enter', 'to return to watch mode.'),
    ];

    this._pipe.write(`\n${message.join('\n')}`);
  }

  private _drawUIProgress() {
    this._clearTestSummary();

    const numPass = this._countPaths - this._testAssertions.length;
    const numRemaining = this._countPaths - numPass - this._skippedNum;
    let stats = `${pluralize('test', numRemaining)} remaining`;

    if (this._skippedNum) {
      const skippedText = chalk.bold.yellow(
        pluralize('snapshot', this._skippedNum) + ' skipped',
      );

      stats = `${stats}, ${skippedText}`;
    }

    const message = [
      TestProgressLabel,
      `${ARROW}${stats}`,
      '\n',
      chalk.bold('Watch Usage'),
      describeKey('s', 'to skip the current test.'),
      describeKey('q', 'to quit Interactive Mode.'),
      describeKey('Enter', 'to return to watch mode.'),
    ];

    this._pipe.write(`\n${message.join('\n')}`);
  }

  private _drawUIOverlay() {
    if (this._testAssertions.length === 0) return this._drawUIDone();

    return this._drawUIProgress();
  }

  private _run() {
    if (this._updateTestRunnerConfig) {
      this._updateTestRunnerConfig(this._testAssertions[0]);
    }
  }

  private abort() {
    this._isActive = false;
    this._skippedNum = 0;

    if (this._updateTestRunnerConfig) {
      this._updateTestRunnerConfig();
    }
  }

  private restart(): void {
    this._skippedNum = 0;
    this._countPaths = this._testAssertions.length;
    this._run();
  }
}
