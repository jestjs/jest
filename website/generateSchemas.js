#!/usr/bin/env node

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs');
const path = require('path');

const nextConfigSchema = require('@jest/schemas').InitialOptions;

const schemasDirectory = path.resolve(__dirname, 'static/schemas');

fs.mkdirSync(schemasDirectory, {recursive: true});

fs.writeFileSync(
  path.resolve(schemasDirectory, 'next.json'),
  JSON.stringify({
    ...nextConfigSchema,
    $id: 'https://jestjs.io/schemas/next.json',
  })
);
