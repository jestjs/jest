'use strict';

const ProjectWorkspace = require('../ProjectWorkspace');

describe('setup', () => {
  it('sets itself up fom the constructor', () => {
    const workspace = new ProjectWorkspace('root_path', 'path_to_jest');
    expect(workspace.rootPath).toEqual('root_path');
    expect(workspace.pathToJest).toEqual('path_to_jest');
  });
});
