/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {AsyncResolver} from '../defaultResolver';

// todo: can be replaced with jest.MockedFunction
declare const userResolver: {
  async: AsyncResolver;
};

export default userResolver;
