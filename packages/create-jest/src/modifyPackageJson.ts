/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {ProjectPackageJson} from './types';

const modifyPackageJson = ({
  projectPackageJson,
  shouldModifyScripts,
}: {
  projectPackageJson: ProjectPackageJson;
  shouldModifyScripts: boolean;
}): string => {
  if (shouldModifyScripts) {
    if (projectPackageJson.scripts) {
      projectPackageJson.scripts.test = 'jest';
    } else {
      projectPackageJson.scripts = {test: 'jest'};
    }
  }

  delete projectPackageJson.jest;

  return `${JSON.stringify(projectPackageJson, null, 2)}\n`;
};

export default modifyPackageJson;
