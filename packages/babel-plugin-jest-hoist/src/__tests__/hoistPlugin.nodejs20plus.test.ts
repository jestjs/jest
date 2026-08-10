/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// We need to use the Node.js implementation of `require` to load Babel 8
// packages, instead of our sandboxed implementation, because Babel 8 is
// written in ESM and we don't support require(esm) yet.
import Module from 'node:module';
import {pathToFileURL} from 'node:url';
const createOriginalNodeRequire = Object.getPrototypeOf(Module).createRequire;
const originalNodeRequire = createOriginalNodeRequire(
  pathToFileURL(__filename),
);

// This import will also `define()` the Babel 7 tests
import {defineTests} from './hoistPlugin.nodejs18.test';

describe('babel 8', () => {
  defineTests({
    babel: originalNodeRequire('@babel-8/core'),
    presetReact: originalNodeRequire('@babel-8/preset-react'),
    presetTypescript: originalNodeRequire('@babel-8/preset-typescript'),
  });
});
