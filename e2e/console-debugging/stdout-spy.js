/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const stripAnsi = require('strip-ansi');

const originalStdoutWrite = process.stdout.write.bind(process.stdout);

global.process.__stdoutWriteMock = global.process.__stdoutWriteMock || null;

/*
  This is a terrible hack to ensure that we monkeyPath stdoutWrite before
  the jest reporter does...
*/
if (!global.process.__stdoutWriteMock) {
  global.process.__stdoutWriteMock = (...args) => {
    const plainText = stripAnsi(args[0]).trim();
    if (plainText.length > 0) {
      global.process.__stdoutWriteMock.text.push(plainText);
    }
    originalStdoutWrite(...args);
  };

  global.process.__stdoutWriteMock.text = [];

  process.stdout.write = global.process.__stdoutWriteMock;
}

module.exports = global.process.__stdoutWriteMock;
