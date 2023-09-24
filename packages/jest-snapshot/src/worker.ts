import type {Node, TraversalAncestors} from '@babel/types';
import {runAsWorker} from 'synckit';
import {indent} from './utils';

const {isAwaitExpression, templateElement, templateLiteral, traverse} =
  // @ts-expect-error requireOutside Babel transform
  requireOutside('@babel/types') as typeof import('@babel/types');

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
                  traverse(ast, (node: Node, ancestors: TraversalAncestors) => {
                    if (node.type !== 'CallExpression') return;

                    const {arguments: args, callee} = node;
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
                    if (snapshot === undefined) {
                      return;
                    }

                    const parent = ancestors[ancestors.length - 1].node;
                    const startColumn =
                      isAwaitExpression(parent) && parent.loc
                        ? parent.loc.start.column
                        : callee.loc.start.column;

                    const useSpaces = !options.useTabs;
                    snapshot = indent(
                      snapshot,
                      Math.ceil(
                        useSpaces
                          ? startColumn / (options.tabWidth ?? 1)
                          : // Each tab is 2 characters.
                            startColumn / 2,
                      ),
                      useSpaces ? ' '.repeat(options.tabWidth ?? 1) : '\t',
                    );

                    const replacementNode = templateLiteral(
                      [
                        templateElement({
                          raw: snapshot,
                        }),
                      ],
                      [],
                    );
                    args[snapshotIndex!] = replacementNode;
                  });
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
