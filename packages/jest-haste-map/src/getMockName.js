const path = require('path');

const mocksPattern = '__mocks__';

const getMockName = (filePath: string) => {
  const mockPath = filePath.split(mocksPattern)[1];
  return mockPath.substring(1, mockPath.lastIndexOf(path.extname(mockPath)));
};

module.exports = getMockName;
