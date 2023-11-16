/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isCI} from 'ci-info';

function checkIsInteractive(): boolean {
  if (isCI) {
    return false;
  }

  // this can happen in a browser with polyfills: https://github.com/defunctzombie/node-process/issues/41
  if (process.stdout == null) {
    return false;
  }

  if (process.stdout.isTTY) {
    return process.env.TERM !== 'dumb';
  }

  return false;
}

const isInteractive = checkIsInteractive();

export default isInteractive;
