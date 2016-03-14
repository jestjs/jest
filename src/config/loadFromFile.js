
'use strict';

const path = require('path');
const normalize = require('./normalize');
const utils = require('jest-util');

function loadFromFile(filePath) {
  return utils.readFile(filePath).then(function(fileData) {
    const config = JSON.parse(fileData);
    if (!config.hasOwnProperty('rootDir')) {
      config.rootDir = process.cwd();
    } else {
      config.rootDir = path.resolve(path.dirname(filePath), config.rootDir);
    }
    return normalize(config);
  });
}

module.exports = loadFromFile;