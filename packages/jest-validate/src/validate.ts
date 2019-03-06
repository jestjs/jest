/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ValidationOptions} from './types';

import defaultConfig from './defaultConfig';

let hasDeprecationWarnings = false;

const shouldSkipValidationForPath = (
  path: Array<string>,
  key: string,
  blacklist?: Array<string>,
) => (blacklist ? blacklist.includes([...path, key].join('.')) : false);

const _validate = (
  config: {[key: string]: any},
  exampleConfig: {[key: string]: any},
  options: ValidationOptions,
  path: Array<string> = [],
): {hasDeprecationWarnings: boolean} => {
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
    } else if (Object.hasOwnProperty.call(exampleConfig, key)) {
      if (
        typeof options.condition === 'function' &&
        typeof options.error === 'function' &&
        !options.condition(config[key], exampleConfig[key])
      ) {
        options.error(key, config[key], exampleConfig[key], options, path);
      }
    } else if (
      shouldSkipValidationForPath(path, key, options.recursiveBlacklist)
    ) {
      // skip validating unknown options inside blacklisted paths
    } else {
      options.unknown &&
        options.unknown(config, exampleConfig, key, options, path);
    }

    if (
      options.recursive &&
      !Array.isArray(exampleConfig[key]) &&
      options.recursiveBlacklist &&
      !shouldSkipValidationForPath(path, key, options.recursiveBlacklist)
    ) {
      _validate(config[key], exampleConfig[key], options, [...path, key]);
    }
  }

  return {hasDeprecationWarnings};
};

const validate = (config: {[key: string]: any}, options: ValidationOptions) => {
  hasDeprecationWarnings = false;

  // Preserve default blacklist entries even with user-supplied blacklist
  const combinedBlacklist: Array<string> = [
    ...(defaultConfig.recursiveBlacklist || []),
    ...(options.recursiveBlacklist || []),
  ];

  const defaultedOptions: ValidationOptions = Object.assign({
    ...defaultConfig,
    ...options,
    recursiveBlacklist: combinedBlacklist,
    title: options.title || defaultConfig.title,
  });

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
