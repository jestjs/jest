/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import CustomConsole from './CustomConsole';

export default class NullConsole extends CustomConsole {
  override assert(): void {}
  override debug(): void {}
  override dir(): void {}
  override error(): void {}
  override info(): void {}
  override log(): void {}
  override time(): void {}
  override timeEnd(): void {}
  override timeLog(): void {}
  override trace(): void {}
  override warn(): void {}
  override group(): void {}
  override groupCollapsed(): void {}
  override groupEnd(): void {}
}
