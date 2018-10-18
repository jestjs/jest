/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Some of the `jest-runtime` tests are very slow and cause
// timeouts on travis
jest.setTimeout(70000);
