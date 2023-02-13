/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import glob = require('glob');
import slash = require('slash');
import type {Config} from '@jest/types';

const OUTSIDE_JEST_VM_PROTOCOL = 'jest-main:';
// String manipulation is easier here, fileURLToPath is only in newer Nodes,
// plus setting non-standard protocols on URL objects is difficult.
export const createOutsideJestVmPath = (path: string): string =>
  `${OUTSIDE_JEST_VM_PROTOCOL}//${encodeURIComponent(path)}`;
export const decodePossibleOutsideJestVmPath = (
  outsideJestVmPath: string,
): string | undefined => {
  if (outsideJestVmPath.startsWith(OUTSIDE_JEST_VM_PROTOCOL)) {
    return decodeURIComponent(
      outsideJestVmPath.replace(
        new RegExp(`^${OUTSIDE_JEST_VM_PROTOCOL}//`),
        '',
      ),
    );
  }
  return undefined;
};

export const findSiblingsWithFileExtension = (
  moduleFileExtensions: Config.ProjectConfig['moduleFileExtensions'],
  from: string,
  moduleName: string,
): string => {
  if (!path.isAbsolute(moduleName) && path.extname(moduleName) === '') {
    const dirname = path.dirname(from);
    const pathToModule = path.resolve(dirname, moduleName);

    try {
      const slashedDirname = slash(dirname);

      const matches = glob
        .sync(`${pathToModule}.*`)
        .map(match => slash(match))
        .map(match => {
          const relativePath = path.posix.relative(slashedDirname, match);

          return path.posix.dirname(match) === slashedDirname
            ? `./${relativePath}`
            : relativePath;
        })
        .map(match => `\t'${match}'`)
        .join('\n');

      if (matches) {
        const foundMessage = `\n\nHowever, Jest was able to find:\n${matches}`;

        const mappedModuleFileExtensions = moduleFileExtensions
          .map(ext => `'${ext}'`)
          .join(', ');

        return (
          `${foundMessage}\n\nYou might want to include a file extension in your import, or update your 'moduleFileExtensions', which is currently ` +
          `[${mappedModuleFileExtensions}].\n\nSee https://jestjs.io/docs/configuration#modulefileextensions-arraystring`
        );
      }
    } catch {}
  }

  return '';
};
