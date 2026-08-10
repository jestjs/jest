/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {validationCondition} from './condition';
import {deprecationWarning} from './deprecated';
import {errorMessage} from './errors';
import type {ValidationOptions} from './types';
import {DEPRECATION, ERROR, WARNING} from './utils';
import {unknownOptionWarning} from './warnings';

const validationOptions: ValidationOptions = {
  comment: '',
  condition: validationCondition,
  deprecate: deprecationWarning,
  deprecatedConfig: {},
  error: errorMessage,
  exampleConfig: {},
  recursive: true,
  // Allow NPM-sanctioned comments in package.json. Use a "//" key.
  recursiveDenylist: ['//'],
  title: {
    deprecation: DEPRECATION,
    error: ERROR,
    warning: WARNING,
  },
  unknown: unknownOptionWarning,
};

export default validationOptions;
