/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 */

/* eslint-disable sort-keys */

'use strict';

const fs = require('fs');
const glob = require('glob');

const languages = require('../languages.js');

console.log('translationPre.js triggered...');

function rmFile(file) {
  try {
    fs.unlinkSync(file);
  } catch (e) {
    /* seriously, unlink throws when the file doesn't exist :( */
  }
}

function rmDir(file) {
  try {
    fs.rmdirSync(file);
  } catch (e) {
    /* seriously, unlink throws when the file doesn't exist :( */
  }
}

function globEach(pattern, cb) {
  glob(pattern, (err, files) => {
    if (err) {
      console.error(err);
      return;
    }
    files.forEach(cb);
  });
}

function execute(nextStep) {
  cleanUpFiles(() => {
    nextStep();
  });
}

function cleanUpFiles(nextStep) {
  /* ******
    Generate folders and files for root level files for enabled languages
  */

  // remove translated doc folders from src/ and build/ all except "/en"
  languages.filter(lang => lang.tag != 'en').map(lang => {
    const folder = lang.tag;

    globEach('build/jest/docs/' + folder + '/**', rmFile);
    globEach('build/jest/docs/' + folder + '/**', rmDir);
    globEach('build/jest/' + folder + '/**', rmFile);
    globEach('build/jest/' + folder + '/**', rmDir);
    globEach('src/jest/docs/' + folder + '/**', rmFile);
    globEach('src/jest/docs/' + folder + '/**', rmDir);
    globEach('src/jest/' + folder + '/**', rmFile);
    globEach('src/jest/' + folder + '/**', rmDir);

    nextStep();
  });
}

module.exports = execute;
