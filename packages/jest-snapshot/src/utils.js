/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Path, SnapshotUpdateState} from 'types/Config';

import {getSerializers} from './plugins';
import chalk from 'chalk';
import fs from 'fs';
import mkdirp from 'mkdirp';
import naturalCompare from 'natural-compare';
import path from 'path';
import prettyFormat from 'pretty-format';
import prettier from 'prettier';
import traverse from 'babel-traverse';
import {templateElement, templateLiteral, file} from 'babel-types';

export type InlineSnapshot = {|
  snapshot: string,
  frame: {line: number, column: number, file: string},
|};

export const SNAPSHOT_EXTENSION = 'snap';
export const SNAPSHOT_VERSION = '1';
const SNAPSHOT_VERSION_REGEXP = /^\/\/ Jest Snapshot v(.+),/;
export const SNAPSHOT_GUIDE_LINK = 'https://goo.gl/fbAQLP';
export const SNAPSHOT_VERSION_WARNING = chalk.yellow(
  `${chalk.bold('Warning')}: Before you upgrade snapshots, ` +
    `we recommend that you revert any local changes to tests or other code, ` +
    `to ensure that you do not store invalid state.`,
);

const writeSnapshotVersion = () =>
  `// Jest Snapshot v${SNAPSHOT_VERSION}, ${SNAPSHOT_GUIDE_LINK}`;

const validateSnapshotVersion = (snapshotContents: string) => {
  const versionTest = SNAPSHOT_VERSION_REGEXP.exec(snapshotContents);
  const version = versionTest && versionTest[1];

  if (!version) {
    return new Error(
      chalk.red(
        `${chalk.bold('Outdated snapshot')}: No snapshot header found. ` +
          `Jest 19 introduced versioned snapshots to ensure all developers ` +
          `on a project are using the same version of Jest. ` +
          `Please update all snapshots during this upgrade of Jest.\n\n`,
      ) + SNAPSHOT_VERSION_WARNING,
    );
  }

  if (version < SNAPSHOT_VERSION) {
    return new Error(
      chalk.red(
        `${chalk.red.bold('Outdated snapshot')}: The version of the snapshot ` +
          `file associated with this test is outdated. The snapshot file ` +
          `version ensures that all developers on a project are using ` +
          `the same version of Jest. ` +
          `Please update all snapshots during this upgrade of Jest.\n\n`,
      ) +
        `Expected: v${SNAPSHOT_VERSION}\n` +
        `Received: v${version}\n\n` +
        SNAPSHOT_VERSION_WARNING,
    );
  }

  if (version > SNAPSHOT_VERSION) {
    return new Error(
      chalk.red(
        `${chalk.red.bold('Outdated Jest version')}: The version of this ` +
          `snapshot file indicates that this project is meant to be used ` +
          `with a newer version of Jest. The snapshot file version ensures ` +
          `that all developers on a project are using the same version of ` +
          `Jest. Please update your version of Jest and re-run the tests.\n\n`,
      ) +
        `Expected: v${SNAPSHOT_VERSION}\n` +
        `Received: v${version}`,
    );
  }

  return null;
};

export const testNameToKey = (testName: string, count: number) =>
  testName + ' ' + count;

export const keyToTestName = (key: string) => {
  if (!/ \d+$/.test(key)) {
    throw new Error('Snapshot keys must end with a number.');
  }

  return key.replace(/ \d+$/, '');
};

export const getSnapshotPath = (testPath: Path) =>
  path.join(
    path.join(path.dirname(testPath), '__snapshots__'),
    path.basename(testPath) + '.' + SNAPSHOT_EXTENSION,
  );

export const getSnapshotData = (
  snapshotPath: Path,
  update: SnapshotUpdateState,
) => {
  const data = Object.create(null);
  let snapshotContents = '';
  let dirty = false;

  if (fs.existsSync(snapshotPath)) {
    try {
      snapshotContents = fs.readFileSync(snapshotPath, 'utf8');
      // eslint-disable-next-line no-new-func
      const populate = new Function('exports', snapshotContents);
      // $FlowFixMe
      populate(data);
    } catch (e) {}
  }

  const validationResult = validateSnapshotVersion(snapshotContents);
  const isInvalid = snapshotContents && validationResult;

  if (update === 'none' && isInvalid) {
    throw validationResult;
  }

  if ((update === 'all' || update === 'new') && isInvalid) {
    dirty = true;
  }

  return ({data, dirty}: {data: any, dirty: boolean});
};

// Extra line breaks at the beginning and at the end of the snapshot are useful
// to make the content of the snapshot easier to read
const addExtraLineBreaks = string =>
  string.includes('\n') ? `\n${string}\n` : string;

export const serialize = (data: any): string => {
  return addExtraLineBreaks(
    normalizeNewlines(
      prettyFormat(data, {
        escapeRegex: true,
        plugins: getSerializers(),
        printFunctionName: false,
      }),
    ),
  );
};

// unescape double quotes
export const unescape = (data: any): string => data.replace(/\\(")/g, '$1');

const printBacktickString = (str: string) => {
  return '`' + str.replace(/`|\\|\${/g, '\\$&') + '`';
};

export const ensureDirectoryExists = (filePath: Path) => {
  try {
    mkdirp.sync(path.join(path.dirname(filePath)), '777');
  } catch (e) {}
};

const normalizeNewlines = string => string.replace(/\r\n|\r/g, '\n');

export const saveSnapshotFile = (
  snapshotData: {[key: string]: string},
  snapshotPath: Path,
) => {
  const snapshots = Object.keys(snapshotData)
    .sort(naturalCompare)
    .map(
      key =>
        'exports[' +
        printBacktickString(key) +
        '] = ' +
        printBacktickString(normalizeNewlines(snapshotData[key])) +
        ';',
    );

  ensureDirectoryExists(snapshotPath);
  fs.writeFileSync(
    snapshotPath,
    writeSnapshotVersion() + '\n\n' + snapshots.join('\n\n') + '\n',
  );
};

export const saveInlineSnapshots = (snapshots: InlineSnapshot[]) => {
  const snapshotsByFile = groupSnapshotsByFile(snapshots);

  for (const sourceFilePath of Object.keys(snapshotsByFile)) {
    saveSnapshotsForFile(snapshotsByFile[sourceFilePath], sourceFilePath);
  }
};

const saveSnapshotsForFile = (
  snapshots: InlineSnapshot[],
  sourceFilePath: Path,
) => {
  const sourceFile = fs.readFileSync(sourceFilePath, 'utf8');
  const config = prettier.resolveConfig.sync(sourceFilePath);
  const {inferredParser} = prettier.getFileInfo.sync(sourceFilePath);

  const newSourceFile = prettier.format(
    sourceFile,
    Object.assign({}, config, {
      filepath: sourceFilePath,
      parser: createParser(snapshots, inferredParser),
    }),
  );

  if (newSourceFile !== sourceFile) {
    fs.writeFileSync(sourceFilePath, newSourceFile);
  }
};

const groupSnapshotsBy = (createKey: InlineSnapshot => string) => (
  snapshots: InlineSnapshot[],
) =>
  snapshots.reduce((object, inlineSnapshot) => {
    const key = createKey(inlineSnapshot);
    return Object.assign(object, {
      [key]: (object[key] || []).concat(inlineSnapshot),
    });
  }, {});

const groupSnapshotsByFrame = groupSnapshotsBy(
  ({frame: {line, column}}) => `${line}:${column - 1}`,
);
const groupSnapshotsByFile = groupSnapshotsBy(({frame: {file}}) => file);

const createParser = (snapshots: InlineSnapshot[], inferredParser: string) => (
  text: string,
  parsers: {[key: string]: (string) => any},
  options: any,
) => {
  // Workaround for https://github.com/prettier/prettier/issues/3150
  options.parser = inferredParser;

  const groupedSnapshots = groupSnapshotsByFrame(snapshots);
  const remainingSnapshots = new Set(snapshots.map(({snapshot}) => snapshot));
  let ast = parsers[inferredParser](text);

  // flow uses a 'Program' parent node, babel expects a 'File'.
  if (ast.type !== 'File') {
    ast = file(ast, ast.comments, ast.tokens);
    delete ast.program.comments;
  }

  traverse(ast, {
    CallExpression({node: {arguments: args, callee}}) {
      if (
        callee.type !== 'MemberExpression' ||
        callee.property.type !== 'Identifier'
      ) {
        return;
      }
      const {line, column} = callee.property.loc.start;
      const snapshotsForFrame = groupedSnapshots[`${line}:${column}`];
      if (!snapshotsForFrame) {
        return;
      }
      if (snapshotsForFrame.length > 1) {
        throw new Error(
          'Jest. Multiple inline snapshots for the same call are not supported.',
        );
      }
      const snapshotIndex = args.findIndex(
        ({type}) => type === 'TemplateLiteral',
      );
      const values = snapshotsForFrame.map(({snapshot}) => {
        remainingSnapshots.delete(snapshot);

        return templateLiteral([templateElement({raw: snapshot})], []);
      });
      const replacementNode = values[0];

      if (snapshotIndex > -1) {
        args[snapshotIndex] = replacementNode;
      } else {
        args.push(replacementNode);
      }
    },
  });

  if (remainingSnapshots.size) {
    throw new Error(`Jest. Couldn't locate all inline snapshots.`);
  }

  return ast;
};
