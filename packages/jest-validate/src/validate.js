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
const validationCondition = require('./condition');
const {BULLET} = require('./utils');

const defaultOptions: ValidationOptions = {
  condition: validationCondition,
  deprecate: deprecationWarning,
  error: errorMessage,
  footer: '',
  titleDeprecation: `${BULLET}Deprecation Warning`,
  titleError: `${BULLET}Validation Error`,
  titleWarning: `${BULLET}Validation Warning`,
  unknown: unknownOptionWarning,
};

const validate = (
  config: Object,
  validConfig: Object,
  deprecatedConfig: ?Object,
  options: ?Object,
) => {
  options = Object.assign(defaultOptions, options);

  if (!validConfig) {
    options.error('validConfig', validConfig, {}, options);
  }

  for (const key in config) {
    if (hasOwnProperty.call(validConfig, key)) {
      if (!options.condition(config[key], validConfig[key])) {
        options.error(key, config[key], validConfig[key], options);
      }
    } else if (deprecatedConfig && key in deprecatedConfig) {
      options.deprecate(config, key, deprecatedConfig, options);
    } else {
      options.unknown(config, key, options);
    }
  }

  return true;
};

module.exports = validate;
