/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {ReadStream, WriteStream} from 'tty';
import * as pc from 'picocolors';
import {KEYS} from 'jest-watcher';

export default function handleDeprecationWarnings(
  pipe: WriteStream,
  stdin: ReadStream = process.stdin,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof stdin.setRawMode === 'function') {
      const messages = [
        pc.red('There are deprecation warnings.\n'),
        `${pc.dim(' \u203A Press ')}Enter${pc.dim(' to continue.')}`,
        `${pc.dim(' \u203A Press ')}Esc${pc.dim(' to exit.')}`,
      ];

      pipe.write(messages.join('\n'));

      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');
      // this is a string since we set encoding above
      stdin.on('data', (key: string) => {
        if (key === KEYS.ENTER) {
          resolve();
        } else if (
          [KEYS.ESCAPE, KEYS.CONTROL_C, KEYS.CONTROL_D].includes(key)
        ) {
          reject();
        }
      });
    } else {
      resolve();
    }
  });
}
