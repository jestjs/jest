/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {ValidationOptions} from './types';

import {deprecationWarning} from './deprecated';
import {unknownOptionWarning} from './warnings';
import {errorMessage} from './errors';
import exampleConfig from './example_config';
import validationCondition from './condition';
import {ERROR, DEPRECATION, WARNING} from './utils';

module.exports = ({
  comment: '',
  condition: validationCondition,
  deprecate: deprecationWarning,
  deprecatedConfig: {},
  error: errorMessage,
  exampleConfig,
  title: {
    deprecation: DEPRECATION,
    error: ERROR,
    warning: WARNING,
  },
  unknown: unknownOptionWarning,
}: ValidationOptions);
