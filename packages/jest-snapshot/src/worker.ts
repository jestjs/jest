/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {runAsWorker} from 'synckit';
import {processPrettierAst} from './utils';

let prettier: typeof import('prettier');

async function getInferredParser(filepath: string) {
  const fileInfo = await prettier.getFileInfo(filepath);

  return fileInfo.inferredParser;
}

runAsWorker(
  async (
    prettierPath: string,
    filepath: string,
    sourceFileWithSnapshots: string,
    snapshotMatcherNames: Array<string>,
  ) => {
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
);
