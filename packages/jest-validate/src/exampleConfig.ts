/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
    key: (): string => 'Deprecation message',
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  error: () => {},
  exampleConfig: {key: 'value', test: 'case'},
  recursive: true,
  recursiveDenylist: [],
  title: {
    deprecation: 'Deprecation Warning',
    error: 'Validation Error',
    warning: 'Validation Warning',
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unknown: () => {},
};

export default config;
