/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// this is a separate file so it can be mocked in tests
export {loadPartialConfig} from '@babel/core';

import {
  PartialConfig,
  TransformOptions,
  // @ts-expect-error: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/51741
  loadPartialConfigAsync as asyncVersion,
} from '@babel/core';

export const loadPartialConfigAsync: (
  options?: TransformOptions,
) => Promise<Readonly<PartialConfig> | null> = asyncVersion;
