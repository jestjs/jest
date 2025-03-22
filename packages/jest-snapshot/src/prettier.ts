/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {makeSynchronizedFunction} from 'make-synchronized';
import type {
  CustomParser as PrettierCustomParser,
  BuiltInParserName as PrettierParserName,
} from 'prettier-v2';
import {processPrettierAst} from './utils';

const simpleDetectParser = (filePath: string): PrettierParserName => {
  const extname = path.extname(filePath);
  if (/\.tsx?$/.test(extname)) {
    return 'typescript';
  }
  return 'babel';
};

// This parser formats snapshots to the correct indentation.
const createFormattingParser =
  (
    snapshotMatcherNames: Array<string>,
    inferredParser: PrettierParserName,
  ): PrettierCustomParser =>
  (text, parsers, options) => {
    // Workaround for https://github.com/prettier/prettier/issues/3150
    options.parser = inferredParser;

    const ast = parsers[inferredParser](text, options);
    processPrettierAst(ast, options, snapshotMatcherNames);

    return ast;
  };

async function getInferredParser(filepath: string) {
  const fileInfo = await prettier.getFileInfo(filepath);
  return fileInfo.inferredParser;
}

let prettier: typeof import('prettier');
export const runPrettier = makeSynchronizedFunction(
  __filename,
  async function runPrettierAsync(
    prettierPath: string,
    filepath: string,
    sourceFileWithSnapshots: string,
    snapshotMatcherNames: Array<string>,
  ): Promise<string> {
    // @ts-expect-error requireOutside
    prettier ??= requireOutside(/*webpackIgnore: true*/ prettierPath);

    const config = await prettier.resolveConfig(filepath, {
      editorconfig: true,
    });

    const inferredParser: string | null =
      typeof config?.parser === 'string'
        ? config.parser
        : await getInferredParser(filepath);

    if (!inferredParser) {
      throw new Error(`Could not infer Prettier parser for file ${filepath}`);
    }

    sourceFileWithSnapshots = await prettier.format(sourceFileWithSnapshots, {
      ...config,
      filepath,
      parser: inferredParser,
    });

    // @ts-expect-error private API
    const {ast} = await prettier.__debug.parse(sourceFileWithSnapshots, {
      ...config,
      filepath,
      originalText: sourceFileWithSnapshots,
      parser: inferredParser,
    });
    processPrettierAst(ast, config, snapshotMatcherNames, true);
    // Snapshots have now been inserted. Run prettier to make sure that the code is
    // formatted, except snapshot indentation. Snapshots cannot be formatted until
    // after the initial format because we don't know where the call expression
    // will be placed (specifically its indentation), so we have to do two
    // prettier.format calls back-to-back.
    // @ts-expect-error private API
    const formatAST = await prettier.__debug.formatAST(ast, {
      ...config,
      filepath,
      originalText: sourceFileWithSnapshots,
      parser: inferredParser,
    });
    return formatAST.formatted;
  },
  'runPrettier',
);

export function runPrettier2(
  prettier: typeof import('prettier-v2'),
  sourceFilePath: string,
  sourceFileWithSnapshots: string,
  snapshotMatcherNames: Array<string>,
): string {
  // Resolve project configuration.
  // For older versions of Prettier, do not load configuration.
  const config = prettier.resolveConfig
    ? prettier.resolveConfig.sync(sourceFilePath, {editorconfig: true})
    : null;

  // Prioritize parser found in the project config.
  // If not found detect the parser for the test file.
  // For older versions of Prettier, fallback to a simple parser detection.
  // @ts-expect-error - `inferredParser` is `string`
  const inferredParser: PrettierParserName | null | undefined =
    (typeof config?.parser === 'string' && config.parser) ||
    (prettier.getFileInfo
      ? prettier.getFileInfo.sync(sourceFilePath).inferredParser
      : simpleDetectParser(sourceFilePath));

  if (!inferredParser) {
    throw new Error(
      `Could not infer Prettier parser for file ${sourceFilePath}`,
    );
  }

  // Snapshots have now been inserted. Run prettier to make sure that the code is
  // formatted, except snapshot indentation. Snapshots cannot be formatted until
  // after the initial format because we don't know where the call expression
  // will be placed (specifically its indentation), so we have to do two
  // prettier.format calls back-to-back.
  return prettier.format(
    prettier.format(sourceFileWithSnapshots, {
      ...config,
      filepath: sourceFilePath,
    }),
    {
      ...config,
      filepath: sourceFilePath,
      parser: createFormattingParser(snapshotMatcherNames, inferredParser),
    },
  );
}
