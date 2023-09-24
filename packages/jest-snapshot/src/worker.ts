import {runAsWorker} from 'synckit';
import {processPrettierAst} from './utils';

let prettier: typeof import('prettier');

runAsWorker(
  async (
    prettierPath: string,
    filepath: string,
    sourceFileWithSnapshots: string,
    snapshotMatcherNames: Array<string>,
  ) => {
    prettier ??= await import(prettierPath);

    const config = await prettier.resolveConfig(filepath, {editorconfig: true});

    const inferredParser: string | null =
      (typeof config?.parser === 'string' && config.parser) ||
      (await prettier.getFileInfo(filepath)).inferredParser;

    if (!inferredParser) {
      throw new Error(`Could not infer Prettier parser for file ${filepath}`);
    }

    // Snapshots have now been inserted. Run prettier to make sure that the code is
    // formatted, except snapshot indentation. Snapshots cannot be formatted until
    // after the initial format because we don't know where the call expression
    // will be placed (specifically its indentation), so we have to do two
    // prettier.format calls back-to-back.
    return await prettier.format(
      await prettier.format(sourceFileWithSnapshots, {
        ...config,
        filepath,
        parser: inferredParser,
      }),
      {
        ...config,
        filepath,
        parser: inferredParser,
        plugins: [
          {
            printers: {
              'jest-snapshot-plugin': {
                preprocess(ast, options) {
                  processPrettierAst(ast, options, snapshotMatcherNames);
                  return ast;
                },
                print(path, options, print) {
                  return print(path);
                },
              },
            },
          },
        ],
      },
    );
  },
);
