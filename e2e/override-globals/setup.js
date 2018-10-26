/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// $FlowFixMe
Date.now = () => 0;
// $FlowFixMe
process.hrtime = () => [0, 5000];
