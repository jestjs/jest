/**
 * Copyright (c) 2016-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const {danger, fail, warn} = require('danger');
const {includes} = require('lodash.includes');
const fs = require('fs');

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

const newJsFiles = danger.git.created_files.filter(path => path.endsWith('js'));

// New JS files should have the FB copyright header + flow
const facebookLicenseHeaderComponents = [
  'Copyright \(c\) .*, Facebook, Inc. All rights reserved.',
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

// Ensure the use of Flow and 'use strict';
const noFlowFiles = newJsFiles.filter(filepath => {
  const content = fs.readFileSync(filepath).toString();
  return includes(content, '@flow') && includes(content, 'use strict');
});

if (noFlowFiles.length > 0) {
  const files = linkableFiles(noFlowFiles);
  const flow = '<code>@flow</code>';
  const strict = "<code>'use strict'</code>";
  warn(`Please ensure that ${flow} and ${strict} are enabled on: ${files}`);
}

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
