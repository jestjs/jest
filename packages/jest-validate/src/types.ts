/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type Title = {
  deprecation?: string;
  error?: string;
  warning?: string;
};

export type DeprecatedOptionFunc = (arg: Record<string, unknown>) => string;

export type DeprecatedOptions = Record<string, DeprecatedOptionFunc>;

export type DeprecationItem = {fatal: boolean; name: string};

export type ValidationOptions = {
  comment?: string;
  condition?: (option: unknown, validOption: unknown) => boolean;
  deprecate?: (
    config: Record<string, unknown>,
    option: string,
    deprecatedOptions: DeprecatedOptions,
    options: ValidationOptions,
  ) => boolean;
  deprecatedConfig?: DeprecatedOptions;
  error?: (
    option: string,
    received: unknown,
    defaultValue: unknown,
    options: ValidationOptions,
    path?: Array<string>,
  ) => void;
  exampleConfig: Record<string, unknown>;
  recursive?: boolean;
  recursiveDenylist?: Array<string>;
  title?: Title;
  unknown?: (
    config: Record<string, unknown>,
    exampleConfig: Record<string, unknown>,
    option: string,
    options: ValidationOptions,
    path?: Array<string>,
  ) => void;
};
