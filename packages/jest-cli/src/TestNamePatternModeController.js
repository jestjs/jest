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

import type {Config} from 'types/Config';

const ansiEscapes = require('ansi-escapes');
const chalk = require('chalk');
const PromptController = require('./lib/PromptController');

const usage = (delimiter: string = '\n') => {
  const messages = [
    `\n ${chalk.bold('Pattern Mode Usage')}`,
    ` ${chalk.dim('\u203A Press')} ESC ${chalk.dim('to exit pattern mode.')}\n`,
  ];

  return messages.filter(message => !!message).join(delimiter) + '\n';
};

const testNamePatternModeController = (
  config: Config,
  pipe: stream$Writable | tty$WriteStream,
  promptController: PromptController,
) => {
  class TestNamePatternModeController {
    run(
      onSuccess: Function,
      onCancel: Function,
    ) {
      pipe.write(ansiEscapes.cursorHide);
      pipe.write(ansiEscapes.clearScreen);
      pipe.write(usage());
      pipe.write(ansiEscapes.cursorShow);

      promptController.prompt(
        this.onChange.bind(this),
        onSuccess,
        onCancel,
      );
    }

    onChange(
      pattern: string
    ) {
      pipe.write(ansiEscapes.eraseLine);
      pipe.write(ansiEscapes.cursorLeft);
      pipe.write(`${chalk.dim(' pattern \u203A')} ${pattern}`);
    }
  }

  return new TestNamePatternModeController();
};

module.exports = testNamePatternModeController;
