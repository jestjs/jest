/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import ModuleNotFoundError from '../ModuleNotFoundError';

const rootDir = path.resolve('/project');

test('carries the MODULE_NOT_FOUND code and the module name', () => {
  const error = new ModuleNotFoundError("Cannot find module 'foo'", 'foo');

  expect(error.code).toBe('MODULE_NOT_FOUND');
  expect(error.moduleName).toBe('foo');
});

test('buildMessage leaves the message alone without a require stack', () => {
  const error = new ModuleNotFoundError("Cannot find module 'foo'");
  error.requireStack = [path.join(rootDir, 'index.js')];

  error.buildMessage(rootDir);

  expect(error.message).toBe("Cannot find module 'foo'");
});

test('buildMessage appends a rootDir-relative require stack', () => {
  const error = new ModuleNotFoundError("Cannot find module 'foo'");
  error.requireStack = [
    path.join(rootDir, 'nested', 'consumer.js'),
    path.join(rootDir, 'index.js'),
  ];

  error.buildMessage(rootDir);

  expect(error.message).toBe(
    "Cannot find module 'foo'\n\nRequire stack:\n  nested/consumer.js\n  index.js",
  );
});

test('buildMessage appends the hint and is idempotent', () => {
  const error = new ModuleNotFoundError("Cannot find module 'foo'");
  error.hint = '\n\nDid you mean bar?';

  error.buildMessage(rootDir);
  error.buildMessage(rootDir);

  expect(error.message).toBe("Cannot find module 'foo'\n\nDid you mean bar?");
});

test('duckType makes a foreign error buildMessage-capable', () => {
  const foreign = new Error("Cannot find module 'foo'") as ModuleNotFoundError;
  foreign.code = 'MODULE_NOT_FOUND';
  foreign.requireStack = [
    path.join(rootDir, 'a.js'),
    path.join(rootDir, 'b.js'),
  ];

  ModuleNotFoundError.duckType(foreign).buildMessage(rootDir);

  expect(foreign.message).toBe(
    "Cannot find module 'foo'\n\nRequire stack:\n  a.js\n  b.js",
  );
});
