/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const path = require('path');
const chalk = require('chalk');
const readline = require('readline');

const RUNNING_TEXT = ' BENCHMARK ';
const RUNNING = chalk.reset.inverse.yellow.bold(RUNNING_TEXT) + ' ';

const COMPLETE_TEXT = ' BENCHMARK ';
const COMPLETE = chalk.reset.inverse.green.bold(COMPLETE_TEXT) + ' ';

const SUCCESS = chalk.green('✓');
const ERROR = chalk.red('✗');
const SUCCESS_TEXT = chalk.reset.inverse.green.bold(' FASTEST ');
const ERROR_TEXT = chalk.reset.inverse.red.bold(' ERROR ');

function roundToPrecision(number, precision) {
  const factor = Math.pow(10, precision);
  const tempNumber = number * factor;
  const roundedTempNumber = Math.round(tempNumber);

  return roundedTempNumber / factor;
};

function print(message: string) {
  return new Promise(resolve => setImmediate(() => {
    process.stdout.write(message);
    resolve();
  }));
}

function clear() {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
}

function colorFilePath(filePath) {
  return chalk.gray(
    path.dirname(filePath) + '/'
  ) + chalk.white.bold(
    path.basename(filePath)
  );
}

async function startBenchmark(filePath: string, benchmarkName: string) {
  await print(RUNNING + colorFilePath(filePath));

  return async function endBenchmark(results) {
    clear();
    const fastestResult = results.filter('fastest')[0];
    let text = COMPLETE + colorFilePath(filePath) + '\n';
    let hasError = false;

    text += `  ${chalk.white.bold(benchmarkName)}:\n`;

    for (let i = 0; i < results.length; i++) {
      const {name, hz, cycles, stats, error} = results[i];
  
      if (error) {
        hasError = true;
        
        text += `  ${ERROR} ${chalk.white(name)}  ${ERROR_TEXT}`;
      } else {
        const ops = Math.floor(parseFloat(hz));
        const margin = roundToPrecision(parseFloat(stats.rme), 2);
        const detail = chalk.gray(
          ` [ ${ops} op/s (±${margin}%) ${ cycles } cycles ]`
        );

        text += `  ${SUCCESS} ${chalk.white(name + detail)}`;
        if (fastestResult === results[i]) {
          text += `  ${SUCCESS_TEXT}`;
        }
      }
      text += '\n';
    }
    text += '\n';
    await print(text);
    if (hasError) {
      throw new Error('A benchmark scenario failed with an error!');
    }
  };
}

module.exports.startBenchmark = startBenchmark;
