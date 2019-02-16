// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

// @flow

import type {Path} from 'types/Config';

import path from 'path';
import slash from 'slash';
import glob from 'glob';

export const findSiblingsWithFileExtension = (
  moduleFileExtensions: Array<string>,
  from: Path,
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
          `[${mappedModuleFileExtensions}].\n\nSee https://jestjs.io/docs/en/configuration#modulefileextensions-array-string`
        );
      }
    } catch (ignored) {}
  }

  return '';
};
