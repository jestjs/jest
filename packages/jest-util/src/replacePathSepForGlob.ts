/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Glob, Path} from '@jest/config-utils';

export default function replacePathSepForGlob(path: Path): Glob {
  return path.replace(/\\(?![{}()+?.^$])/g, '/');
}
