/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {ValidationOptions} from './types';

const config: ValidationOptions = {
  comment: '  A comment',
  condition: () => true,
  deprecate: () => false,
  deprecatedConfig: {
    key: () => {},
  },
  error: () => {},
  exampleConfig: {key: 'value', test: 'case'},
  recursive: true,
  recursiveBlacklist: [],
  title: {
    deprecation: 'Deprecation Warning',
    error: 'Validation Error',
    warning: 'Validation Warning',
  },
  unknown: () => {},
};

export default config;
