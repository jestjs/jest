/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pico from 'picocolors';

export default function getNoTestFoundPassWithNoTests(): string {
  return pico.bold('No tests found, exiting with code 0');
}
