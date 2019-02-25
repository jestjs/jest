/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// For some reason, doing `require`ing here works, while inside `cli` fails
export const VERSION: string = require('../package.json').version;
