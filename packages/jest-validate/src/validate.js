/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ValidationOptions} from './types';

import defaultConfig from './default_config';

let hasDeprecationWarnings = false;

const _validate = (
  config: Object,
  exampleConfig: Object,
  options: ValidationOptions,
) => {
  if (
    typeof config !== 'object' ||
    config == null ||
    typeof exampleConfig !== 'object' ||
    exampleConfig == null
  ) {
    return {hasDeprecationWarnings};
  }

  for (const key in config) {
    if (
      options.deprecatedConfig &&
      key in options.deprecatedConfig &&
      typeof options.deprecate === 'function'
    ) {
      const isDeprecatedKey = options.deprecate(
        config,
        key,
        options.deprecatedConfig,
        options,
      );

      hasDeprecationWarnings = hasDeprecationWarnings || isDeprecatedKey;
    } else if (hasOwnProperty.call(exampleConfig, key)) {
      if (
        typeof options.condition === 'function' &&
        typeof options.error === 'function' &&
        !options.condition(config[key], exampleConfig[key])
      ) {
        options.error(key, config[key], exampleConfig[key], options);
      }
    } else {
      options.unknown && options.unknown(config, exampleConfig, key, options);
    }
    _validate(config[key], exampleConfig[key], options);
  }

  return {hasDeprecationWarnings};
};

const validate = (config: Object, options: ValidationOptions) => {
  hasDeprecationWarnings = false;
  // _validate(options, options.exampleConfig, defaultConfig); // validate against jest-validate config
  console.log(config);
  console.log(config.exampleConfig);
  const defaultedOptions: ValidationOptions = Object.assign(
    {},
    defaultConfig,
    options,
    {title: Object.assign({}, defaultConfig.title, options.title)},
  );

  const {hasDeprecationWarnings: hdw} = _validate(
    config,
    options.exampleConfig,
    defaultedOptions,
  );

  return {
    hasDeprecationWarnings: hdw,
    isValid: true,
  };
};

export default validate;
