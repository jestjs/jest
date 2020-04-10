/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'fs';
import * as path from 'path';
import semver = require('semver');
import {loadPartialConfig} from '@babel/core';
import generate from '@babel/generator';
import {ParserOptions, parse} from '@babel/parser';
import type traverse from '@babel/traverse';
import {
  CallExpression,
  Expression,
  File,
  Program,
  file,
  templateElement,
  templateLiteral,
} from '@babel/types';
import type {Frame} from 'jest-message-util';

import type {Config} from '@jest/types';
import {escapeBacktickString} from './utils';

export type InlineSnapshot = {
  snapshot: string;
  frame: Frame;
  node?: Expression;
};
type BabelTraverse = typeof traverse;

export function saveInlineSnapshots(
  snapshots: Array<InlineSnapshot>,
  prettier: typeof import('prettier') | null,
  babelTraverse: Function,
): void {
  const snapshotsByFile = groupSnapshotsByFile(snapshots);

  for (const sourceFilePath of Object.keys(snapshotsByFile)) {
    saveSnapshotsForFile(
      snapshotsByFile[sourceFilePath],
      sourceFilePath,
      prettier && semver.gte(prettier.version, '1.5.0') ? prettier : null,
      babelTraverse as BabelTraverse,
    );
  }
}

const saveSnapshotsForFile = (
  snapshots: Array<InlineSnapshot>,
  sourceFilePath: Config.Path,
  prettier: any,
  babelTraverse: BabelTraverse,
) => {
  const sourceFile = fs.readFileSync(sourceFilePath, 'utf8');

  const {options} = loadPartialConfig({filename: sourceFilePath}) || {
    options: {},
  };
  if (!options.plugins) {
    options.plugins = [];
  }

  // TypeScript projects may not have a babel config; make sure they can be parsed anyway.
  if (
    /\.tsx?$/.test(sourceFilePath) &&
    options.plugins.indexOf('typescript') === -1
  ) {
    options.plugins.push('typescript');
  }
  if (/\.tsx/.test(sourceFilePath) && options.plugins.indexOf('jsx') === -1) {
    options.plugins.push('jsx');
  }

  // Record the matcher names seen during traversal and pass them down one
  // by one to formatting parser.
  const snapshotMatcherNames: Array<string> = [];

  const ast = parse(sourceFile, options as ParserOptions);
  traverseAst(snapshots, ast, snapshotMatcherNames, babelTraverse);

  // substitute in the snapshots in reverse order, so slice calculations aren't thrown off.
  const sourceFileWithSnapshots = snapshots.reduceRight(
    (sourceSoFar, nextSnapshot) => {
      if (
        !nextSnapshot.node ||
        typeof nextSnapshot.node.start !== 'number' ||
        typeof nextSnapshot.node.end !== 'number'
      ) {
        throw new Error('Jest: no snapshot insert location found');
      }
      return (
        sourceSoFar.slice(0, nextSnapshot.node.start) +
        generate(nextSnapshot.node, {retainLines: true}).code.trim() +
        sourceSoFar.slice(nextSnapshot.node.end)
      );
    },
    sourceFile,
  );

  let newSourceFile = sourceFileWithSnapshots;
  if (prettier) {
    // Resolve project configuration.
    // For older versions of Prettier, do not load configuration.
    const config = prettier.resolveConfig
      ? prettier.resolveConfig.sync(sourceFilePath, {
          editorconfig: true,
        })
      : null;

    // Detect the parser for the test file.
    // For older versions of Prettier, fallback to a simple parser detection.
    const inferredParser = prettier.getFileInfo
      ? prettier.getFileInfo.sync(sourceFilePath).inferredParser
      : (config && config.parser) || simpleDetectParser(sourceFilePath);

    // Snapshots have now been inserted. Run prettier to make sure that the code is
    // formatted, except snapshot indentation. Snapshots cannot be formatted until
    // after the initial format because we don't know where the call expression
    // will be placed (specifically its indentation).
    newSourceFile = prettier.format(newSourceFile, {
      ...config,
      filepath: sourceFilePath,
    });

    if (newSourceFile !== sourceFileWithSnapshots) {
      // prettier moved things around, run it again to fix snapshot indentations.
      newSourceFile = prettier.format(newSourceFile, {
        ...config,
        filepath: sourceFilePath,
        parser: createFormattingParser(
          snapshotMatcherNames,
          inferredParser,
          babelTraverse,
        ),
      });
    }
  }

  if (newSourceFile !== sourceFile) {
    fs.writeFileSync(sourceFilePath, newSourceFile);
  }
};

const groupSnapshotsBy = (
  createKey: (inlineSnapshot: InlineSnapshot) => string,
) => (snapshots: Array<InlineSnapshot>) =>
  snapshots.reduce<Record<string, Array<InlineSnapshot>>>(
    (object, inlineSnapshot) => {
      const key = createKey(inlineSnapshot);
      return {...object, [key]: (object[key] || []).concat(inlineSnapshot)};
    },
    {},
  );

const groupSnapshotsByFrame = groupSnapshotsBy(({frame: {line, column}}) =>
  typeof line === 'number' && typeof column === 'number'
    ? `${line}:${column - 1}`
    : '',
);
const groupSnapshotsByFile = groupSnapshotsBy(({frame: {file}}) => file);

const indent = (snapshot: string, numIndents: number, indentation: string) => {
  const lines = snapshot.split('\n');
  // Prevent re-indentation of inline snapshots.
  if (
    lines.length >= 2 &&
    lines[1].startsWith(indentation.repeat(numIndents + 1))
  ) {
    return snapshot;
  }

  return lines
    .map((line, index) => {
      if (index === 0) {
        // First line is either a 1-line snapshot or a blank line.
        return line;
      } else if (index !== lines.length - 1) {
        // Do not indent empty lines.
        if (line === '') {
          return line;
        }

        // Not last line, indent one level deeper than expect call.
        return indentation.repeat(numIndents + 1) + line;
      } else {
        // The last line should be placed on the same level as the expect call.
        return indentation.repeat(numIndents) + line;
      }
    })
    .join('\n');
};

const resolveAst = (fileOrProgram: any): File => {
  // Flow uses a 'Program' parent node, babel expects a 'File'.
  let ast = fileOrProgram;
  if (ast.type !== 'File') {
    ast = file(ast, ast.comments, ast.tokens);
    delete ast.program.comments;
  }
  return ast;
};

const traverseAst = (
  snapshots: Array<InlineSnapshot>,
  fileOrProgram: File | Program,
  snapshotMatcherNames: Array<string>,
  babelTraverse: BabelTraverse,
) => {
  const ast = resolveAst(fileOrProgram);

  const groupedSnapshots = groupSnapshotsByFrame(snapshots);
  const remainingSnapshots = new Set(snapshots.map(({snapshot}) => snapshot));

  babelTraverse(ast, {
    CallExpression({node}) {
      const {arguments: args, callee} = node;
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
          'Jest: Multiple inline snapshots for the same call are not supported.',
        );
      }

      snapshotMatcherNames.push(callee.property.name);

      const snapshotIndex = args.findIndex(
        ({type}) => type === 'TemplateLiteral',
      );
      const values = snapshotsForFrame.map(inlineSnapshot => {
        inlineSnapshot.node = node;
        const {snapshot} = inlineSnapshot;
        remainingSnapshots.delete(snapshot);

        return templateLiteral(
          [templateElement({raw: escapeBacktickString(snapshot)})],
          [],
        );
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
    throw new Error(`Jest: Couldn't locate all inline snapshots.`);
  }
};

// This parser formats snapshots to the correct indentation.
const createFormattingParser = (
  snapshotMatcherNames: Array<string>,
  inferredParser: string,
  babelTraverse: BabelTraverse,
) => (
  text: string,
  parsers: Record<string, (text: string) => any>,
  options: any,
) => {
  // Workaround for https://github.com/prettier/prettier/issues/3150
  options.parser = inferredParser;

  const ast = resolveAst(parsers[inferredParser](text));
  babelTraverse(ast, {
    CallExpression({node: {arguments: args, callee}}: {node: CallExpression}) {
      if (
        callee.type !== 'MemberExpression' ||
        callee.property.type !== 'Identifier' ||
        !snapshotMatcherNames.includes(callee.property.name) ||
        !callee.loc ||
        callee.computed
      ) {
        return;
      }

      let snapshotIndex: number | undefined;
      let snapshot: string | undefined;
      for (let i = 0; i < args.length; i++) {
        const node = args[i];
        if (node.type === 'TemplateLiteral') {
          snapshotIndex = i;
          snapshot = node.quasis[0].value.raw;
        }
      }
      if (snapshot === undefined || snapshotIndex === undefined) {
        return;
      }

      const useSpaces = !options.useTabs;
      snapshot = indent(
        snapshot,
        Math.ceil(
          useSpaces
            ? callee.loc.start.column / options.tabWidth
            : callee.loc.start.column / 2, // Each tab is 2 characters.
        ),
        useSpaces ? ' '.repeat(options.tabWidth) : '\t',
      );

      const replacementNode = templateLiteral(
        [
          templateElement({
            raw: snapshot,
          }),
        ],
        [],
      );
      args[snapshotIndex] = replacementNode;
    },
  });

  return ast;
};

const simpleDetectParser = (filePath: Config.Path) => {
  const extname = path.extname(filePath);
  if (/tsx?$/.test(extname)) {
    return 'typescript';
  }
  return 'babylon';
};
