/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type * as Config from './Config';

// this is here to make it possible to avoid huge dependency trees just for types
export type CallerTransformOptions = {
  // names are copied from babel: https://babeljs.io/docs/en/options#caller
  supportsDynamicImport: boolean;
  supportsExportNamespaceFrom: boolean;
  supportsStaticESM: boolean;
  supportsTopLevelAwait: boolean;
};

export type ReducedTransformOptions = CallerTransformOptions & {
  instrument: boolean;
};

/** What a `Transformer`'s cache key can depend on. */
export type CacheKeyOptions = ReducedTransformOptions & {
  /** Jest configuration of currently running project. */
  config: Config.ProjectConfig;
  /** Stringified version of the `config` - useful in cache busting. */
  configString: string;
};

export type TransformResult = {
  code: string;
  originalCode: string;
  sourceMapPath: string | null;
};
