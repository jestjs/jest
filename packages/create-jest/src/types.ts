/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';

export interface ProjectPackageJson {
  jest?: Partial<Config.InitialOptions>;
  scripts?: Record<string, string>;
  type?: 'commonjs' | 'module';
}

export interface PromptsResults {
  useTypescript: boolean;
  clearMocks: boolean;
  coverage: boolean;
  coverageProvider: string;
  environment: string;
  scripts: boolean;
}
