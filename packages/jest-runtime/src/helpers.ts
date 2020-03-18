/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import slash = require('slash');
import glob = require('glob');
import {Config} from '@jest/types';
import {Path} from '@jest/types/src/Config';

export const findSiblingsWithFileExtension = (
  moduleFileExtensions: Config.ProjectConfig['moduleFileExtensions'],
  from: Config.Path,
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
          foundMessage +
          "\n\nYou might want to include a file extension in your import, or update your 'moduleFileExtensions', which is currently " +
          `[${mappedModuleFileExtensions}].\n\nSee https://jestjs.io/docs/en/configuration#modulefileextensions-arraystring`
        );
      }
    } catch (ignored) {}
  }

  return '';
};

export const printRequireStack = (
  requireStack: Array<string>,
  rootDir: Path,
): string => `

Require stack:
  ${requireStack.map(p => p.replace(`${rootDir}${path.sep}`, '')).join('\n  ')}
`;
