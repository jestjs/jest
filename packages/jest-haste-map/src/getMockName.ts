/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';

const MOCKS_DIRECTORY = '__mocks__';
const MOCKS_PATTERN = `${path.sep}${MOCKS_DIRECTORY}${path.sep}`;

// `dir/__mocks__/Module.js` mocks `dir/Module.js`, and jest-runtime finds it by
// probing that path. A mock nested deeper — `dir/__mocks__/sub/Module.js` — has
// no such module, so it is only ever reachable by its mock name.
export const getAdjacentModulePath = (filePath: string): string | null => {
  const mockDirectory = path.dirname(filePath);
  return path.basename(mockDirectory) === MOCKS_DIRECTORY
    ? path.join(path.dirname(mockDirectory), path.basename(filePath))
    : null;
};

const getMockName = (filePath: string): string => {
  const mockPath = filePath.split(MOCKS_PATTERN)[1];
  return mockPath
    .slice(0, mockPath.lastIndexOf(path.extname(mockPath)))
    .replaceAll('\\', '/');
};

export default getMockName;
