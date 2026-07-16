/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import stripBOM from 'strip-bom';
import type {SourceMapRegistry} from '@jest/source-map';
import type {
  CallerTransformOptions,
  ScriptTransformer,
  TransformResult,
  TransformationOptions,
} from '@jest/transform';
import type {FileCache} from './FileCache';

export interface TransformOptions extends Required<CallerTransformOptions> {
  isInternalModule: boolean;
}

export class TransformCache {
  private readonly scriptTransformer: ScriptTransformer;
  private readonly fileCache: FileCache;
  private readonly getFullTransformationOptions: (
    options: TransformOptions | undefined,
  ) => TransformationOptions;
  private readonly transforms = new Map<string, TransformResult>();
  private readonly mutex = new Map<string, Promise<void>>();
  private readonly sourceMaps: SourceMapRegistry = new Map();

  constructor(
    scriptTransformer: ScriptTransformer,
    fileCache: FileCache,
    getFullTransformationOptions: (
      options: TransformOptions | undefined,
    ) => TransformationOptions,
  ) {
    this.scriptTransformer = scriptTransformer;
    this.fileCache = fileCache;
    this.getFullTransformationOptions = getFullTransformationOptions;
  }

  transform(filename: string, options?: TransformOptions): string {
    const source = this.fileCache.readFile(filename);
    if (options?.isInternalModule) return source;

    const transformedFile = this.scriptTransformer.transform(
      filename,
      this.getFullTransformationOptions(options),
      source,
    );
    this.transforms.set(filename, transformedFile);
    if (transformedFile.sourceMapPath) {
      this.sourceMaps.set(filename, transformedFile.sourceMapPath);
    }
    return transformedFile.code;
  }

  async transformAsync(
    filename: string,
    options?: TransformOptions,
  ): Promise<string> {
    const source = this.fileCache.readFile(filename);
    if (options?.isInternalModule) return source;

    const transformedFile = await this.scriptTransformer.transformAsync(
      filename,
      this.getFullTransformationOptions(options),
      source,
    );
    if (this.transforms.get(filename)?.code !== transformedFile.code) {
      this.transforms.set(filename, transformedFile);
    }
    if (transformedFile.sourceMapPath) {
      this.sourceMaps.set(filename, transformedFile.sourceMapPath);
    }
    return transformedFile.code;
  }

  canTransformSync(filename: string): boolean {
    return this.scriptTransformer.canTransformSync(filename);
  }

  getCachedSource(filename: string): string | undefined {
    return this.transforms.get(filename)?.code;
  }

  // Reads + transforms a `.json` file's source, returning the transformed
  // text (still a string). Caller is responsible for `JSON.parse`-ing in the
  // appropriate realm.
  transformJson(filename: string, options?: TransformOptions): string {
    const source = stripBOM(this.fileCache.readFile(filename));
    return this.scriptTransformer.transformJson(
      filename,
      this.getFullTransformationOptions(options),
      source,
    );
  }

  getEntries(): ReadonlyMap<string, TransformResult> {
    return this.transforms;
  }

  getSourceMaps(): SourceMapRegistry {
    return this.sourceMaps;
  }

  // Mutex deduplicates parallel `transformAsync`s of the same module across
  // concurrent `loadEsmModule` calls on the legacy async path. Goes away
  // once min-Node ≥ v24.9 makes that path obsolete.
  hasMutex(key: string): boolean {
    return this.mutex.has(key);
  }
  awaitMutex(key: string): Promise<void> | undefined {
    return this.mutex.get(key);
  }
  setMutex(key: string, promise: Promise<void>): void {
    this.mutex.set(key, promise);
  }
  clearMutex(key: string): void {
    this.mutex.delete(key);
  }

  // `resetModules` calls this; source maps are preserved so post-reset stack
  // traces still resolve. `teardown` calls `clear()` instead.
  clearForReset(): void {
    this.transforms.clear();
    this.mutex.clear();
  }

  clear(): void {
    this.clearForReset();
    this.sourceMaps.clear();
  }
}
