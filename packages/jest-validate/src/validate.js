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

const defaultOptions: ValidationOptions = {
  condition: validationCondition,
  deprecate: deprecationWarning,
  error: errorMessage,
  footer: null,
  namespace: null,
  unknown: unknownOptionWarning,
};

const validate = (
  config: Object,
  validConfig: Object,
  deprecatedConfig: ?Object,
  options: ?ValidationOptions
) => {
  options = Object.assign(defaultOptions, options);

  if (!validConfig) {
    options.error('validConfig', validConfig, {}, options);
  }

  for (const option in config) {
    if (hasOwnProperty.call(validConfig, option)) {
      if (!options.condition(config[option], validConfig[option])) {
        options.error(
          option, config[option], validConfig[option], options
        );
      }
    } else if (deprecatedConfig && option in deprecatedConfig) {
      options.deprecate(config, option, deprecatedConfig, options);
    } else {
      options.unknown(config, option, options);
    }
  }

  return true;
};

module.exports = validate;
