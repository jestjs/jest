/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * @flow
 */
 
 'use strict'

const ImmutableOrderedSetPlugin = require('./ImmutableOrderedSet');
const ImmutableListPlugin = require('./ImmutableList');
const ImmutableMapPlugin = require('./ImmutableMap');
const ImmutableOrderedMapPlugin = require('./ImmutableOrderedMap');
const ImmutableSetPlugin = require('./ImmutableSet');
const ImmutableStackPlugin = require('./ImmutableStack');

module.exports = [
  ImmutableOrderedSetPlugin,
  ImmutableListPlugin,
  ImmutableOrderedMapPlugin,
  ImmutableMapPlugin,
  ImmutableSetPlugin,
  ImmutableStackPlugin,
];
