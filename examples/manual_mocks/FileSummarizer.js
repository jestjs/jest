// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

const fs = require('fs');

function summarizeFilesInDirectorySync(directory) {
  return fs.readdirSync(directory).map(fileName => ({
    fileName,
    directory,
  }));
}

exports.summarizeFilesInDirectorySync = summarizeFilesInDirectorySync;
