/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This is a setup file run once per test file before the test code.

// Enable colors in tests even when no colors are used for framework output,
// in which case snapshot matching would fail otherwise.
process.env.FORCE_COLOR = '1';
