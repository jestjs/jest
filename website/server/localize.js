/* eslint-disable sort-keys */

'use strict';

// Load list of languages
// For languages that are enabled
//    Setup by deleting all language fo
//    Create an empty folder /lang/ to hold the localized files /lang/en 
//    Create a forked copy of files in directory and supporting markdown

const fs = require('fs');
const glob = require('glob');
const mkdirp = require('mkdirp');
const optimist = require('optimist');
const path = require('path');

const argv = optimist.argv;

console.log("localize.js triggered...")

function globEach(pattern, cb) {
  glob(pattern, (err, files) => {
    if (err) {
      console.error(err);
      return;
    }
    files.forEach(cb);
  });
}

function rmFile(file) {
  try {
    fs.unlinkSync(file);
  } catch (e) {
    /* seriously, unlink throws when the file doesn't exist :( */
  }
}

function backtickify(str) {
  let escaped = '`' + str.replace(/\\/g, '\\\\').replace(/`/g, '\\`') + '`';
  // Replace require( with require\( so node-haste doesn't replace example
  // require calls in the docs
  escaped = escaped.replace(/require\(/g, 'require\\(');

  // Replace ${var} with \${var} so we can use place holders
  return escaped.replace(/\$\{([\w\s\d\'\:\.\(\)\?]*)\}/g, '\\${$1}');
}

function splitHeader(content) {
  const lines = content.split('\n');
  let i = 1;
  for (; i < lines.length - 1; ++i) {
    if (lines[i] === '---') {
      break;
    }
  }
  return {
    header: lines.slice(1, i + 1).join('\n'),
    content: lines.slice(i + 1).join('\n'),
  };
}

// Extract markdown metadata header
function extractMetadata(content) {
  const metadata = {};
  const both = splitHeader(content);
  const lines = both.header.split('\n');
  for (let i = 0; i < lines.length - 1; ++i) {
    const keyvalue = lines[i].split(':');
    const key = keyvalue[0].trim();
    let value = keyvalue.slice(1).join(':').trim();
    // Handle the case where you have "Community #10"
    try { value = JSON.parse(value); } catch (e) { }
    metadata[key] = value;
  }
  return {metadata, rawContent: both.content};
}

function writeFileAndCreateFolder(file, content) {
  mkdirp.sync(file.replace(new RegExp('/[^/]*$'), ''));
  fs.writeFileSync(file, content);
}

function execute() {

  const SOURCE_DOCS_MD_DIR = '../docs/en/';

  const gettingStarted = extractMetadata(
    fs.readFileSync(SOURCE_DOCS_MD_DIR + 'GettingStarted.md', 'utf8')
  )

console.log(gettingStarted);

  // const languages = require('../i18n/languages.json');

  // const res = extractMetadata(fs.readFileSync(file, {encoding: 'utf8'}));

  // languages
  // .filter((lang) => {return lang.enabled})
  // .map((lang) => {
  //   console.log("Copying core files for: " + lang.tag);


  // })
}

if (argv.convert) {
  console.log('convert!');
  execute();
}

module.exports = execute;
