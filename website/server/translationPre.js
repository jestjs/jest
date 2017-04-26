/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 */

/* eslint-disable sort-keys */

'use strict';

const fs = require('fs');
const glob = require('glob');
const mkdirp = require('mkdirp');
const optimist = require('optimist');
const path = require('path');

const prettier = require('prettier');

const languages = require('../languages.js');

const argv = optimist.argv;

console.log('translationPre.js triggered...');

function writeFileAndCreateFolder(file, content) {
  mkdirp.sync(file.replace(new RegExp('/[^/]*$'), ''));
  fs.writeFileSync(file, content);
}

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

function execute() {
  generateBaseFiles();
  generateJS();
}

function generateBaseFiles() {
  /* ******
    Generate folders and files for root level files for enabled languages
  */

  // remove folders for all except "/en"

  languages.filter(lang => lang.tag != 'en').map(lang => {
    const folder = lang.tag;
    glob('src/jest/' + folder + '/**', (er, files) => {
      files.map(file => {
        rmFile(file);
      });
      files.map(file => {
        rmDir(file);
      });
    });
  });

  // wait 1000ms to create files
  setTimeout(() => {
    languages
      .filter(lang => lang.tag != 'en')
      .filter(lang => lang.enabled)
      .map(lang => {
        const folder = lang.tag;

        const indexTemplate =
          '/* This is a generated file */\n' +
          "const React = require('React');\n" +
          "const JestIndex = require('JestIndex');\n" +
          'const index = React.createClass({\n' +
          '  render() {\n' +
          "    return <JestIndex language={'\n" +
          folder +
          "'} />;\n" +
          '  },\n' +
          '});\n' +
          'module.exports = index;\n';
        const helpTemplate =
          '/* This is a generated file */\n' +
          "const React = require('React');\n" +
          "const JestHelp = require('JestHelp');\n" +
          'const help = React.createClass({\n' +
          '  render() {\n' +
          "    return <JestHelp language={'\n" +
          folder +
          "'} />;\n" +
          '  },\n' +
          '});\n' +
          'module.exports = help;\n';
        const usersTemplate =
          '/* This is a generated file */\n' +
          "const React = require('React');\n" +
          "const JestUsers = require('JestUsers');\n" +
          'const users = React.createClass({\n' +
          '  render() {\n' +
          "    return <JestUsers language={'\n" +
          folder +
          "'} />;\n" +
          '    },\n' +
          '});\n' +
          'module.exports = users;\n';
        const supportTemplate =
          '/* This is a generated file */\n' +
          "const React = require('React');\n" +
          "const RedirectLayout = require('RedirectLayout');\n" +
          'class Support extends React.Component {\n' +
          '  render() {\n' +
          '    const metadata = {\n' +
          "      destinationUrl: 'help.html',\n" +
          "      id: 'support',\n" +
          "      layout: 'redirect',\n" +
          "      permalink: '/jest/support.html',\n" +
          "      source: 'support.md',\n" +
          '    };\n' +
          '    return <RedirectLayout metadata={metadata} />;\n' +
          '  }\n' +
          '}\n' +
          'module.exports = Support;\n';

        writeFileAndCreateFolder(
          'src/jest/' + folder + '/index.js',
          indexTemplate
        );
        writeFileAndCreateFolder(
          'src/jest/' + folder + '/help.js',
          helpTemplate
        );
        writeFileAndCreateFolder(
          'src/jest/' + folder + '/users.js',
          usersTemplate
        );
        writeFileAndCreateFolder(
          'src/jest/' + folder + '/support.js',
          supportTemplate
        );
      });

    const indexTemplate =
      '/* This is a generated file */\n' +
      "const React = require('React');\n" +
      "const JestIndex = require('JestIndex');\n" +
      'const index = React.createClass({\n' +
      '  render() {\n' +
      "    return <JestIndex language={'en'} />;\n" +
      '  },\n' +
      '});\n' +
      'module.exports = index;\n';
    const helpTemplate =
      '/* This is a generated file */\n' +
      "const React = require('React');\n" +
      "const JestHelp = require('JestHelp');\n" +
      'const help = React.createClass({\n' +
      '  render() {\n' +
      "    return <JestHelp language={'en'} />;\n" +
      '  },\n' +
      '});\n' +
      'module.exports = help;\n';
    const usersTemplate =
      '/* This is a generated file */\n' +
      "const React = require('React');\n" +
      "const JestUsers = require('JestUsers');\n" +
      'const users = React.createClass({\n' +
      '  render() {\n' +
      "    return <JestUsers language={'en'} />;\n" +
      '  },\n' +
      '});\n' +
      'module.exports = users;\n';
    const supportTemplate =
      '/* This is a generated file */\n' +
      "const React = require('React');\n" +
      "const RedirectLayout = require('RedirectLayout');\n" +
      'class Support extends React.Component {\n' +
      '  render() {\n' +
      '    const metadata = {\n' +
      "      destinationUrl: 'help.html',\n" +
      "      id: 'support',\n" +
      "      layout: 'redirect',\n" +
      "      permalink: '/jest/support.html',\n" +
      "      source: 'support.md',\n" +
      '    };\n' +
      '    return <RedirectLayout metadata={metadata} />;\n' +
      '  }\n' +
      '}\n' +
      'module.exports = Support;\n';

    writeFileAndCreateFolder('src/jest/index.js', indexTemplate);
    writeFileAndCreateFolder('src/jest/help.js', helpTemplate);
    writeFileAndCreateFolder('src/jest/users.js', usersTemplate);
    writeFileAndCreateFolder('src/jest/support.js', supportTemplate);
  }, 1000);
}

function generateJS() {
  /* ******
    Generate JS files from JSON
  */
  const I18N_JSON_DIR = './i18n/';
  globEach('i18n/*.js', rmFile);
  // crowdin doesn't accept .js files for conversion, but does
  // accept .json files convert these json files to .js so they
  // can be required from siteConfig.js
  glob(I18N_JSON_DIR + '**', (er, files) => {
    files.forEach(file => {
      const extension = path.extname(file);

      if (extension === '.json') {
        const fileContent = fs.readFileSync(file, 'utf8');
        const baseName = path.basename(file);
        const outputFileName = baseName.substr(0, baseName.indexOf('.json'));

        const prettyFileContent = prettier.format(
          'module.exports = ' + fileContent,
          {
            useTabs: false,
            printWidth: 80,
            tabWidth: 2,
            singleQuote: true,
            trailingComma: 'es5',
            bracketSpacing: true,
            jsxBracketSameLine: false,
            parser: 'babylon',
            semi: true,
          }
        );

        fs.writeFileSync('./i18n/' + outputFileName + '.js', prettyFileContent);
      }
    });
  });
}

if (argv.convert) {
  console.log('convert i18n translation files!');
  execute();
}

module.exports = execute;
