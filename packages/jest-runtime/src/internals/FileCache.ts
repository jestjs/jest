/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';

export default class FileCache {
  private readonly strings: Map<string, string>;
  private readonly buffers = new Map<string, BufferSource>();

  constructor(cacheFS: Map<string, string>) {
    this.strings = cacheFS;
  }

  readFile(filename: string): string {
    let source = this.strings.get(filename);
    if (!source) {
      source = this.readFileBuffer(filename).toString();
      this.strings.set(filename, source);
    }
    return source;
  }

  readFileBuffer(filename: string): BufferSource {
    let source = this.buffers.get(filename);
    if (!source) {
      source = fs.readFileSync(filename);
      this.buffers.set(filename, source);
    }
    return source;
  }

  clear(): void {
    this.strings.clear();
    this.buffers.clear();
  }
}
