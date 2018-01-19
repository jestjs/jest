/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type JestHooks = {
  showPrompt: any,
};

export type WatchPlugin = {
  key: number,
  name: string,
  prompt: string,
  apply: (
    jestHooks: JestHooks,
    {
      stdin: stream$Readable | tty$ReadStream,
      stdout: stream$Writable | tty$WriteStream,
    },
  ) => void,
};
