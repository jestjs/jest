// @flow

import {fail, warn, danger} from 'danger';
import fs from 'fs';

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

// New js files should have `@flow` at the top
// but exclude tests from being flow-ey
const unFlowedFiles = newJsFiles.filter(path => !path.endsWith('test.js'))
  .filter(filepath => {
    const content = fs.readFileSync(filepath).toString();
    return !content.includes('@flow');
  });

if (unFlowedFiles.length > 0) {
  const files = linkableFiles(unFlowedFiles);
  warn(`New JS files do not have Flow enabled: ${files}`);
}

// New JS files should have the FB copyright header
const noFBCopyrightFiles = newJsFiles.filter(filepath => {
  const content = fs.readFileSync(filepath).toString();
  return !content.includes('Facebook, Inc. All rights reserved');
});

if (noFBCopyrightFiles.length > 0) {
  const files = linkableFiles(noFBCopyrightFiles);
  fail(`New JS files do not have the Facebook copyright header: ${files}`);
}
