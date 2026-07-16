/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'graceful-fs';

const linkRegex =
  /\[#(\d+)]\(https:\/\/github.com\/([^/]+)\/jest\/([^/]+)\/(\d+)\)/g;

const mainChangelogPath = 'CHANGELOG.md';
const changelogPaths = [mainChangelogPath, 'CHANGELOG_PRE_v30.md'];
const prNumber = process.argv[2];

const errors = [];

for (const changelogPath of changelogPaths) {
  const data = fs.readFileSync(changelogPath, 'utf8');

  let lineNumber = 1;
  for (const line of data.split('\n')) {
    for (const match of line.matchAll(linkRegex)) {
      const [, linkNumber, org, type, urlNumber] = match;
      const column = match.index + 1;
      const location = `${changelogPath}:${lineNumber}:${column}: error: `;
      if (org !== 'jestjs') {
        errors.push(
          `${location}Expected org 'jestjs', got '${org}': ${match[0]}`,
        );
      }
      if (type !== 'pull') {
        errors.push(`${location}Expected 'pull', got '${type}': ${match[0]}`);
      }
      if (linkNumber !== urlNumber) {
        errors.push(
          `${location}Link number ${linkNumber} does not match URL number ${urlNumber}: ${match[0]}`,
        );
      }
    }
    ++lineNumber;
  }
}

if (prNumber != null) {
  if (!/^[1-9]\d*$/.test(prNumber)) {
    throw new Error(`PR number must be a positive integer, got: ${prNumber}`);
  }

  const mainChangelog = fs.readFileSync(mainChangelogPath, 'utf8');
  const mainSection = mainChangelog
    .split(/^## /m)
    .find(s => s.startsWith('main\n'));
  const expectedLink = `[#${prNumber}](https://github.com/jestjs/jest/pull/${prNumber})`;
  if (mainSection == null || !mainSection.includes(expectedLink)) {
    errors.push(
      `${mainChangelogPath}: missing entry for PR #${prNumber} in "## main" — expected: ${expectedLink}`,
    );
  }
}

if (errors.length > 0) {
  console.error(
    `Found ${errors.length} error${
      errors.length === 1 ? '' : 's'
    } in changelog:\n`,
  );
  for (const error of errors) {
    console.error(error);
  }
  process.exit(1);
}
