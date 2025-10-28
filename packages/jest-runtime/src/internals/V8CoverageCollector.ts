/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {fileURLToPath} from 'node:url';
import {CoverageInstrumenter, type V8Coverage} from 'collect-v8-coverage';
import type {V8CoverageResult} from '@jest/test-result';
import {
  type ShouldInstrumentOptions,
  type TransformResult,
  shouldInstrument,
} from '@jest/transform';
import type {Config} from '@jest/types';
import type {TransformCache} from './TransformCache';

export class V8CoverageCollector {
  private readonly coverageOptions: ShouldInstrumentOptions;
  private readonly config: Config.ProjectConfig;
  private readonly transformCache: TransformCache;
  private instrumenter: CoverageInstrumenter | undefined;
  private result: V8Coverage | undefined;
  private sources: Map<string, TransformResult> | undefined;

  constructor(
    coverageOptions: ShouldInstrumentOptions,
    config: Config.ProjectConfig,
    transformCache: TransformCache,
  ) {
    this.coverageOptions = coverageOptions;
    this.config = config;
    this.transformCache = transformCache;
  }

  async start(): Promise<void> {
    this.instrumenter = new CoverageInstrumenter();
    this.sources = new Map();
    await this.instrumenter.startInstrumenting();
  }

  async stop(): Promise<void> {
    if (!this.instrumenter || !this.sources) {
      throw new Error('You need to call `collectV8Coverage` first.');
    }
    this.result = await this.instrumenter.stopInstrumenting();
    this.sources = new Map([
      ...this.sources,
      ...this.transformCache.getEntries(),
    ]);
  }

  // Snapshot transforms about to be cleared (e.g. by `resetModules`) so the
  // mapping from URL to transformed source survives across the reset.
  snapshotTransforms(): void {
    if (
      !this.coverageOptions.collectCoverage ||
      this.coverageOptions.coverageProvider !== 'v8' ||
      !this.sources
    ) {
      return;
    }
    this.sources = new Map([
      ...this.sources,
      ...this.transformCache.getEntries(),
    ]);
  }

  getResult(): V8CoverageResult {
    if (!this.result || !this.sources) {
      throw new Error('You need to call `stopCollectingV8Coverage` first.');
    }
    const sources = this.sources;
    return this.result
      .filter(res => res.url.startsWith('file://'))
      .map(res => ({...res, url: fileURLToPath(res.url)}))
      .filter(
        res =>
          // TODO: will this work on windows? It might be better if `shouldInstrument` deals with it anyways
          res.url.startsWith(
            this.coverageOptions.globalRootDir ?? this.config.rootDir,
          ) &&
          shouldInstrument(
            res.url,
            this.coverageOptions,
            this.config,
            /* loadedFilenames */ [...sources.keys()],
          ),
      )
      .map(result => ({
        codeTransformResult: sources.get(result.url),
        result,
      }));
  }

  reset(): void {
    this.sources?.clear();
    this.result = [];
    this.instrumenter = undefined;
  }
}
