/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const originalStdoutWrite = process.stdout.write.bind(process.stdout);

process.__stdoutWriteMock = process.__stdoutWriteMock || null;

/*
  This is a terrible hack to ensure that we monkeyPath stdoutWrite before
  the jest reporter does...
*/
if (!process.__stdoutWriteMock) {
  process.__stdoutWriteMock = (...args) => {
    process.__stdoutWriteMock.text = args[0];
    originalStdoutWrite(...args);
  };

  process.stdout.write = process.__stdoutWriteMock;
}

module.exports = process.__stdoutWriteMock;
