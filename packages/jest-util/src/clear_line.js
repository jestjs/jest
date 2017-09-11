/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
/* global stream$Writable */

export default (stream: stream$Writable | tty$WriteStream) => {
  if (process.stdout.isTTY) {
    stream.write('\x1b[999D\x1b[K');
  }
};
