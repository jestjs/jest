/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import ProjectWorkspace from '../project_workspace';

describe('setup', () => {
  it('sets itself up fom the constructor', () => {
    const workspace = new ProjectWorkspace(
      'root_path',
      'path_to_jest',
      'path_to_config',
      1000,
    );
    expect(workspace.rootPath).toEqual('root_path');
    expect(workspace.pathToJest).toEqual('path_to_jest');
  });
});
