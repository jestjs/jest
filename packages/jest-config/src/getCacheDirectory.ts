/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {tmpdir} from 'os';
import {sync as _realpath} from 'realpath-native';

import shouldPreserveSymlinks from 'should-preserve-links';

const preserveSymlinks = shouldPreserveSymlinks();
function realpath(p: string) {
  return preserveSymlinks ? p : _realpath(p);
}

const getCacheDirectory = () => {
  const {getuid} = process;
  const tmpdirPath = path.join(realpath(tmpdir()), 'jest');
  if (getuid == null) {
    return tmpdirPath;
  } else {
    // On some platforms tmpdir() is `/tmp`, causing conflicts between different
    // users and permission issues. Adding an additional subdivision by UID can
    // help.
    return `${tmpdirPath}_${getuid.call(process).toString(36)}`;
  }
};

export default getCacheDirectory;
