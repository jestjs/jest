/**
 * @flow
 */

import type {AggregatedResult} from 'types/TestResult';

const chalk = require('chalk');
const ansiEscapes = require('ansi-escapes');
const {pluralize} = require('./reporters/utils');
const {rightPad} = require('./lib/terminalUtils');
const {KEYS} = require('./constants');

module.exports = class SnapshotInteractiveMode {
  _pipe: stream$Writable | tty$WriteStream;
  _isActive: boolean;
  _updateTestRunnerConfig: (a: string, jestRunnerOptions: Object) => *;
  _testFilePaths: Array<string>;
  _countPaths: number;

  constructor(pipe: stream$Writable | tty$WriteStream) {
    this._pipe = pipe;
    this._isActive = false;
  }

  isActive() {
    return this._isActive;
  }

  _drawUIOverlay() {
    this._pipe.write(ansiEscapes.scrollDown);
    this._pipe.write(ansiEscapes.scrollDown);

    this._pipe.write(ansiEscapes.cursorSavePosition);
    this._pipe.write(ansiEscapes.cursorTo(0, 0));

    const title = rightPad(' -> Interactive Snapshot Update Activated <-');
    this._pipe.write(chalk.black.bold.bgYellow(title));

    this._pipe.write(ansiEscapes.cursorRestorePosition);
    this._pipe.write(ansiEscapes.cursorUp(6));
    this._pipe.write(ansiEscapes.eraseDown);

    const numFailed = this._testFilePaths.length;
    const numPass = this._countPaths - this._testFilePaths.length;

    let stats = chalk.bold.red(pluralize('suite', numFailed) + ' failed');
    if (numPass) {
      stats += ', ' + chalk.bold.green(pluralize('suite', numPass) + ' passed');
    }
    const messages = [
      '\n' + chalk.bold('Interactive Snapshot Progress'),
      ' \u203A ' + stats,
      '\n' + chalk.bold('Watch Usage'),
      chalk.dim(' \u203A Press ') +
        'u' +
        chalk.dim(' to update failing snapshots.'),
      this._testFilePaths.length > 1
        ? chalk.dim(' \u203A Press ') +
            's' +
            chalk.dim(' to skip the current snapshot..')
        : '',
      chalk.dim(' \u203A Press ') +
        'q' +
        chalk.dim(' to quit interactive snapshot mode.'),
      chalk.dim(' \u203A Press ') +
        'Enter' +
        chalk.dim(' to trigger a test run.'),
    ];

    this._pipe.write(messages.filter(message => !!message).join('\n') + '\n');
  }

  put(key: string) {
    switch (key) {
      case KEYS.S:
        const testFilePath = this._testFilePaths.shift();
        this._testFilePaths.push(testFilePath);
        this._run({});
        break;

      case KEYS.U:
        this._run({updateSnapshot: 'all'});
        break;

      case KEYS.Q:
      case KEYS.ESCAPE:
        this.abort();
        break;

      case KEYS.ENTER:
        this._run({});
        break;
      default:
        console.log('got key event', key);
        break;
    }
  }

  abort() {
    this._isActive = false;
    this._updateTestRunnerConfig('', {});
  }

  updateWithResults(results: AggregatedResult) {
    const hasSnapshotFailure = !!results.snapshot.failure;
    if (hasSnapshotFailure) {
      this._drawUIOverlay();
      return;
    }

    this._testFilePaths.shift();
    if (this._testFilePaths.length === 0) {
      this.abort();
      return;
    }
    this._run({});
  }

  _run(jestRunnerOptions: Object) {
    const testFilePath = this._testFilePaths[0];
    this._updateTestRunnerConfig(testFilePath, jestRunnerOptions);
  }

  run(
    failedSnapshotTestPaths: Array<string>,
    onConfigChange: (path: string, jestRunnerOptions: Object) => *,
  ) {
    if (!failedSnapshotTestPaths.length) {
      return;
    }

    this._testFilePaths = [].concat(failedSnapshotTestPaths);
    this._countPaths = this._testFilePaths.length;
    this._updateTestRunnerConfig = onConfigChange;
    this._isActive = true;
    this._run({});
  }
};
