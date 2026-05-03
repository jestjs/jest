// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

const fs = require('node:fs');

function summarizeFilesInDirectorySync(directory) {
  return fs.readdirSync(directory).map(fileName => ({directory, fileName}));
}

exports.summarizeFilesInDirectorySync = summarizeFilesInDirectorySync;
