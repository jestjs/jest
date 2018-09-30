/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This file exists so that mocks in userland does not affect snapshots

import fs from 'fs';

export const boundReadFile = fs.readFileSync.bind(fs);
export const boundWriteFile = fs.writeFileSync.bind(fs);
export const boundExistsSync = fs.existsSync.bind(fs);
