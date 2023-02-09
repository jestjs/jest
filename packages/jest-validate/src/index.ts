/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export {
  ValidationError,
  createDidYouMeanMessage,
  format,
  logValidationWarning,
} from './utils';
export type {DeprecatedOptions} from './types';
export {default as validate} from './validate';
export {default as validateCLIOptions} from './validateCLIOptions';
export {multipleValidOptions} from './condition';
