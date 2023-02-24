/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const os = jest.createMockFromModule('os');

let cpus;
function __setCpus(newCpus) {
  cpus = newCpus;
}

os.__setCpus = __setCpus;
os.cpus = jest.fn(() => cpus);

if (typeof os.availableParallelism === 'function') {
  os.availableParallelism = jest.fn(() => cpus?.length ?? 0);
}

module.exports = os;
