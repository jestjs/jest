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

const {logValidationWarning, DEPRECATION} = require('./utils');

const deprecationMessage = (message: string, options: ValidationOptions) => {
  const comment = options.comment;
  const name = options.title && options.title.deprecation || DEPRECATION;

  logValidationWarning(name, message, comment);
};

const deprecationWarning = (
  config: Object,
  option: string,
  deprecatedOptions: Object,
  options: ValidationOptions
): boolean => {
  if (option in deprecatedOptions) {
    deprecationMessage(deprecatedOptions[option](config), options);

    return true;
  }

  return false;
};

module.exports = {
  deprecationWarning,
};
