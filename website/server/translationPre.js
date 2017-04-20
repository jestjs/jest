/* eslint-disable sort-keys */

'use strict';

const feed = require('./feed');
const fs = require('fs');
const glob = require('glob');
const mkdirp = require('mkdirp');
const optimist = require('optimist');
const path = require('path');

const languages = require("../languages.js");

const argv = optimist.argv;

console.log("translationPre.js triggered...")

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

  languages
    .filter((lang) => lang.tag != "en")
    .map((lang) => {
      let folder = lang.tag;
      glob('src/jest/' + folder + "/" + '**', (er, files) => {
        files
          .map((file) => {
            rmFile(file);
          });
        files
          .map((file) =>{
            rmDir(file);
          })
      });
    });

    // wait 1000ms to create files
    setTimeout(() =>{
      languages
        .filter((lang) => lang.tag != "en")
        .filter((lang) => lang.enabled)
        .map((lang) => {
          let folder = lang.tag;

          let indexTemplate = "const React = require('React'); const JestIndex = require('JestIndex'); const index = React.createClass({ render() { return (<JestIndex language={'"+folder+"'} />)}}); module.exports = index;"
          let helpTemplate = "const React = require('React'); const JestHelp = require('JestHelp'); const support = React.createClass({ render() { return (<JestHelp language={'"+folder+"'} />)}}); module.exports = support;"
          let usersTemplate = "const React = require('React'); const JestUsers = require('JestUsers'); const index = React.createClass({ render() { return ( <JestUsers language={'"+folder+"'} /> ) } }); module.exports = index; "
          let supportTemplate = "const React = require('React'); const RedirectLayout = require('RedirectLayout'); class Support extends React.Component { render() { const metadata = { 'id': 'support', 'layout': 'redirect', 'permalink': '/jest/support.html', 'destinationUrl': 'help.html', 'source': 'support.md', }; return ( <RedirectLayout metadata={metadata} /> ); } } module.exports = Support;"

          writeFileAndCreateFolder('src/jest/' + folder + "/index.js", indexTemplate);
          writeFileAndCreateFolder('src/jest/' + folder + "/help.js", helpTemplate);
          writeFileAndCreateFolder('src/jest/' + folder + "/users.js", usersTemplate);
          writeFileAndCreateFolder('src/jest/' + folder + "/support.js", supportTemplate);
        });

        let indexTemplate = "const React = require('React'); const JestIndex = require('JestIndex'); const index = React.createClass({ render() { return (<JestIndex language={'en'} />)}}); module.exports = index;"
        let helpTemplate = "const React = require('React'); const JestHelp = require('JestHelp'); const support = React.createClass({ render() { return (<JestHelp language={'en'} />)}}); module.exports = support;"
        let usersTemplate = "const React = require('React'); const JestUsers = require('JestUsers'); const index = React.createClass({ render() { return ( <JestUsers language={'en'} /> ) } }); module.exports = index; "
        let supportTemplate = "const React = require('React'); const RedirectLayout = require('RedirectLayout'); class Support extends React.Component { render() { const metadata = { 'id': 'support', 'layout': 'redirect', 'permalink': '/jest/support.html', 'destinationUrl': 'help.html', 'source': 'support.md', }; return ( <RedirectLayout metadata={metadata} /> ); } } module.exports = Support;"

        writeFileAndCreateFolder('src/jest/index.js', indexTemplate);
        writeFileAndCreateFolder('src/jest/help.js', helpTemplate);
        writeFileAndCreateFolder('src/jest/users.js', usersTemplate);
        writeFileAndCreateFolder('src/jest/support.js', supportTemplate);

      }, 1000)

}

function generateJS() {
  /* ******
    Generate JS files from JSON
  */
  const I18N_JSON_DIR = './i18n/';
// 
  globEach('i18n/*.js', rmFile);
// 
  // crowdin doesn't accept .js files for conversion, but does accept .json files
  // convert these json files to .js so they can be required from siteConfig.js
  glob(I18N_JSON_DIR + '**', (er, files) => {

    files.forEach(file => {
      
      const extension = path.extname(file);

      if (extension === '.json') {

        const fileContent = fs.readFileSync(file, 'utf8');
        const baseName = path.basename(file);
        const outputFileName = baseName.substr(0, baseName.indexOf(".json"))

        fs.writeFileSync(
          './i18n/' + outputFileName + ".js",
          'module.exports = ' + fileContent      
        );

      }
    });

  });

}

if (argv.convert) {
  console.log('convert i18n translation files!');
  execute();
}

module.exports = execute;
