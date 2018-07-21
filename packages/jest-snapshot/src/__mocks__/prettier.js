const prettier = require.requireActual('prettier');

module.exports = {
  format: (text, opts) =>
    prettier.format(
      text,
      Object.assign(
        {
          pluginSearchDirs: [
            require('path').dirname(require.resolve('prettier')),
          ],
        },
        opts,
      ),
    ),
  getFileInfo: {sync: () => ({inferredParser: 'babylon'})},
  resolveConfig: {sync: jest.fn()},
  version: prettier.version,
};
