#!/usr/bin/env node
/* build-hook-start *//*00001*/try { require('/Users/luca/.vscode/extensions/wallabyjs.console-ninja-0.0.71/out/buildHook/index.js').default({tool: 'jest'}); } catch(e) { try { import('file:///Users/luca/.vscode/extensions/wallabyjs.console-ninja-0.0.71/out/buildHook/index.js').then(m => m.default.default({tool: 'jest'})).catch(p => {}) } catch(e) { }}/* build-hook-end */

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const importLocal = require('import-local');

if (!importLocal(__filename)) {
  require('jest-cli/bin/jest');
}
