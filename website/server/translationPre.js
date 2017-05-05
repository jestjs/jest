/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 */

/* eslint-disable sort-keys */

'use strict';

const fs = require('fs');
const glob = require('glob');

const translation = require('./translation.js');

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
  glob.sync(pattern).forEach(cb);
}

function execute() {
  cleanUpFiles();
}

function cleanUpFiles() {
  /* ******
    Generate folders and files for root level files for enabled languages
  */

  console.log('Cleaning up i18n/*.js, build/, and src/ files...');

  globEach('i18n/*.js', rmFile);

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
  });

  // Convert localized .json files into .js
  translation();
}

module.exports = execute;
