/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const path = require('path');
const os = require('os');

import {sync as realpath} from 'realpath-native';

const getCacheDirectory = () => {
  const {getuid} = process;
  if (getuid == null) {
    return path.join(realpath(os.tmpdir()), 'jest');
  }
  // On some platforms tmpdir() is `/tmp`, causing conflicts between different
  // users and permission issues. Adding an additional subdivision by UID can
  // help.
  return path.join(
    realpath(os.tmpdir()),
    'jest_' + getuid.call(process).toString(36),
  );
};

export default getCacheDirectory;
