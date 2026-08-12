/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/** Transformed file path to the map file written for it. */
export type SourceMapRegistry = Map<string, string>;

/** The platform's mapping between file names, URLs and bytes. */
export interface SourceMapFileReader {
  /** Takes anything the platform uses to name a file. */
  read(urlOrPath: string): string | null;
  /** Anything that is not a `file:` href is returned unchanged. */
  toPath(url: string): string;
  /** Anything that already names a scheme is returned unchanged. */
  toUrl(pathOrUrl: string): string;
}
