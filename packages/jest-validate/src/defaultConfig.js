/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {ValidationOptions} from './types';

const {deprecationWarning} = require('./deprecated');
const {unknownOptionWarning} = require('./warnings');
const {errorMessage} = require('./errors');
const exampleConfig = require('./exampleConfig');
const validationCondition = require('./condition');
const {ERROR, DEPRECATION, WARNING} = require('./utils');

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
