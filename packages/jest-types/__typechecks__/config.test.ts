/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectAssignable} from 'mlh-tsd';
import type {Config} from '@jest/types';

expectAssignable<Config.InitialOptions>({
  coverageThreshold: {
    './src/api/very-important-module.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/components/': {
      branches: 40,
      statements: 40,
    },
    './src/reducers/**/*.js': {
      statements: 90,
    },
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  projects: [
    // projects can be globs or objects
    './src/**',
    {
      displayName: 'A Project',
      rootDir: './src/components',
    },
  ],
});
