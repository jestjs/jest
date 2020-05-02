/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Some of the `jest-runtime` tests are very slow and cause
// timeouts on travis
jest.setTimeout(70000);

// this module does some funky stuff with `require.cache`, flooding the terminal with output
jest.mock('stealthy-require', () => (_, m) => m());
