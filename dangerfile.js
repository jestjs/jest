/**
 * Copyright (c) 2016-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

// Want to make changes? Check out the README in /danger/README.md for advice

'use strict';

const {danger, fail, warn} = require('danger');
const fs = require('fs');
// As danger's deps are inside a sub-folder, need to resolve via relative paths
const includes = require('./danger/node_modules/lodash.includes/index');

// Takes a list of file paths, and converts it into clickable links
const linkableFiles = (paths: Array<string>): string => {
  const repoURL = danger.github.pr.head.repo.html_url;
  const ref = danger.github.pr.head.ref;
  const links = paths.map(path => {
    return createLink(`${repoURL}/blob/${ref}/${path}`, path);
  });
  return toSentence(links);
};

// ["1", "2", "3"] to "1, 2 and 3"
const toSentence = (array: Array<string>) : string => {
  if (array.length === 1) { return array[0]; }
  return array.slice(0, array.length - 1).join(', ') + ' and ' + array.pop();
};

// ("/href/thing", "name") to "<a href="/href/thing">name</a>"
const createLink = (href: string, text: string): string =>
  `<a href='${href}'>${text}</a>`;

// Raise about missing code inside files
const raiseIssueAboutPaths = (
  type: Function,
  paths: string[],
  codeToInclude: string) => {

  if (paths.length > 0) {
    const files = linkableFiles(paths);
    const strict = '<code>' + codeToInclude + '</code>';
    type(`Please ensure that ${strict} is enabled on: ${files}`);
  }
};

const newJsFiles = danger.git.created_files.filter(path => path.endsWith('js'));
const isSourceFile = path => 
  includes(path, '/src/') &&
  !includes(path, '__tests__');

// New JS files should have the FB copyright header + flow
const facebookLicenseHeaderComponents = [
  'Copyright \\(c\\) .*, Facebook, Inc. All rights reserved.',
  'This source code is licensed under the BSD-style license found in the',
  'LICENSE file in the root directory of this source tree. An additional grant',
  'of patent rights can be found in the PATENTS file in the same directory.',
];

const noFBCopyrightFiles = newJsFiles.filter(filepath => {
  const content = fs.readFileSync(filepath).toString();
  for (const line of facebookLicenseHeaderComponents) {
    if (!content.match(new RegExp(line))) {
      return true;
    }
  }
  return false;
});

if (noFBCopyrightFiles.length > 0) {
  const files = linkableFiles(noFBCopyrightFiles);
  fail(`New JS files do not have the Facebook copyright header: ${files}`);
}

// Ensure the majority of all files use Flow
// Does not run for test files, and also offers a warning not an error.
const noFlowFiles = newJsFiles
  .filter(isSourceFile)
  .filter(filepath => {
    const content = fs.readFileSync(filepath).toString();
    return !includes(content, '@flow');
  });

raiseIssueAboutPaths(warn, noFlowFiles, '@flow');

// detects the presence of ES module import/export syntax, while ignoring the
// variant introduced by flowtype; examples here: http://regexr.com/3f64p
const esModuleRegex = /^(import|export)\s(?!type(of\s|\s)(?!from)).*?$/gm;

// Ensure the use of 'use strict' on all non-ES module files
const noStrictFiles = newJsFiles.filter(filepath => {
  const content = fs.readFileSync(filepath).toString();
  return !esModuleRegex.test(content) && !includes(content, 'use strict');
});

raiseIssueAboutPaths(fail, noStrictFiles, "'use strict'");

// No merge from master commmits
// TODO: blocked by https://github.com/danger/danger-js/issues/81

// Warns if there are changes to package.json without changes to yarn.lock.

const packageChanged = includes(danger.git.modified_files, 'package.json');
const lockfileChanged = includes(danger.git.modified_files, 'yarn.lock');
if (packageChanged && !lockfileChanged) {
  const message = 'Changes were made to package.json, but not to yarn.lock';
  const idea = 'Perhaps you need to run `yarn install`?';
  warn(`${message} - <i>${idea}</i>`);
}
