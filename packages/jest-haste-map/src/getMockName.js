const path = require('path');

const getMockName = (filePath, mocksPattern) => {
  const modulePath = filePath.split(mocksPattern)[1];

  const extractMockName = new RegExp(
    `^\\${path.sep}?(.*?)(\\${path.sep}index)?\\${path.extname(modulePath)}$`
  );

  return extractMockName.exec(modulePath)[1];
};

module.exports = getMockName;
