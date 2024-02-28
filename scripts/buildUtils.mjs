/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {strict as assert} from 'assert';
import {createRequire} from 'module';
import * as path from 'path';
import {fileURLToPath} from 'url';
import chalk from 'chalk';
import fs from 'graceful-fs';
import {sync as readPkg} from 'read-pkg';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import babelConfig from '../babel.config.js';

export const PACKAGES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../packages',
);
const require = createRequire(import.meta.url);

export const OK = chalk.reset.inverse.bold.green(' DONE ');
export const ERROR = chalk.reset.inverse.bold.red(' BOOM ');

export const typeOnlyPackages = new Set([
  'babel-preset-jest',
  '@jest/environment',
  '@jest/globals',
  '@jest/types',
  '@jest/test-globals',
]);

// Get absolute paths of all directories under packages/*
function getPackages() {
  const packages = fs
    .readdirSync(PACKAGES_DIR)
    .map(file => path.resolve(PACKAGES_DIR, file))
    .filter(f => fs.lstatSync(path.resolve(f)).isDirectory())
    .filter(f => fs.existsSync(path.join(path.resolve(f), 'package.json')));
  const rootPackage = require('../package.json');

  const nodeEngineRequirement = rootPackage.engines.node;

  return packages.map(packageDir => {
    const pkg = readPkg({cwd: packageDir});

    assert.ok(pkg.engines, `Engine requirement in "${pkg.name}" should exist`);

    assert.strictEqual(
      pkg.engines.node,
      nodeEngineRequirement,
      `Engine requirement in "${pkg.name}" should match root`,
    );

    assert.ok(
      pkg.exports,
      `Package "${pkg.name}" is missing \`exports\` field`,
    );
    assert.deepStrictEqual(
      pkg.exports,
      {
        '.':
          pkg.types == null
            ? pkg.main
            : typeOnlyPackages.has(pkg.name)
              ? /* eslint-disable sort-keys */
                {
                  types: pkg.types,
                  default: pkg.main,
                }
              : {
                  types: pkg.types,
                  require: pkg.main,
                  import: pkg.main.replace(/\.js$/, '.mjs'),
                  default: pkg.main,
                },
        /* eslint-enable */
        './package.json': './package.json',
        ...Object.fromEntries(
          Object.values(pkg.bin || {}).map(curr => [
            curr.replace(/\.js$/, ''),
            curr,
          ]),
        ),
        ...(pkg.name === 'jest-circus'
          ? {'./runner': './build/runner.js'}
          : {}),
        ...(pkg.name === 'expect'
          ? {
              './build/matchers': './build/matchers.js',
              './build/toThrowMatchers': './build/toThrowMatchers.js',
            }
          : {}),
      },
      `Package "${pkg.name}" does not export correct files`,
    );

    if (pkg.types) {
      assert.strictEqual(
        pkg.main,
        './build/index.js',
        `Package "${pkg.name}" should have "./build/index.js" as main`,
      );
      assert.strictEqual(
        pkg.types,
        './build/index.d.ts',
        `Package "${pkg.name}" should have "./build/index.d.ts" as types`,
      );
    } else {
      assert.strictEqual(
        pkg.main,
        './index.js',
        `Package "${pkg.name}" should have "./index.js" as main`,
      );
    }

    if (pkg.bin) {
      for (const [binName, binPath] of Object.entries(pkg.bin)) {
        const fullBinPath = path.resolve(packageDir, binPath);

        if (!fs.existsSync(fullBinPath)) {
          throw new Error(
            `Binary in package "${pkg.name}" with name "${binName}" at ${binPath} does not exist`,
          );
        }
      }
    }

    return {packageDir, pkg};
  });
}

export function getPackagesWithTsConfig() {
  return getPackages().filter(p =>
    fs.existsSync(path.resolve(p.packageDir, 'tsconfig.json')),
  );
}

export const INLINE_REQUIRE_EXCLUDE_LIST =
  /packages\/expect|(jest-(circus|diff|get-type|jasmine2|matcher-utils|message-util|regex-util|snapshot))|pretty-format\//;

export const copyrightSnippet = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
`.trim();

export function createBuildConfigs() {
  const packages = getPackages();

  return packages.map(({packageDir, pkg}) => {
    const input = `${packageDir}/src/index.ts`;

    if (!fs.existsSync(input)) {
      return {packageDir, pkg};
    }

    const options = Object.assign({}, babelConfig);
    options.plugins = [...options.plugins];

    if (INLINE_REQUIRE_EXCLUDE_LIST.test(input)) {
      // The excluded modules are injected into the user's sandbox
      // We need to guard some globals there.
      options.plugins.push(
        require.resolve('./babel-plugin-jest-native-globals'),
      );
    } else {
      options.plugins = options.plugins.map(plugin => {
        if (
          Array.isArray(plugin) &&
          plugin[0] === '@babel/plugin-transform-modules-commonjs'
        ) {
          return [plugin[0], Object.assign({}, plugin[1], {lazy: true})];
        }

        return plugin;
      });
    }

    const separateChunks =
      pkg.name === 'jest-worker'
        ? {
            processChild: path.resolve(
              packageDir,
              './src/workers/processChild.ts',
            ),
            threadChild: path.resolve(
              packageDir,
              './src/workers/threadChild.ts',
            ),
          }
        : pkg.name === 'jest-haste-map'
          ? {worker: path.resolve(packageDir, './src/worker.ts')}
          : pkg.name === '@jest/reporters'
            ? {
                CoverageWorker: path.resolve(
                  packageDir,
                  './src/CoverageWorker.ts',
                ),
              }
            : pkg.name === 'jest-runner'
              ? {testWorker: path.resolve(packageDir, './src/testWorker.ts')}
              : pkg.name === 'jest-circus'
                ? {
                    jestAdapterInit: path.resolve(
                      packageDir,
                      './src/legacy-code-todo-rewrite/jestAdapterInit.ts',
                    ),
                  }
                : pkg.name === 'jest-jasmine2'
                  ? {
                      'jasmine/jasmineLight': path.resolve(
                        packageDir,
                        './src/jasmine/jasmineLight.ts',
                      ),
                      jestExpect: path.resolve(
                        packageDir,
                        './src/jestExpect.ts',
                      ),
                      setup_jest_globals: path.resolve(
                        packageDir,
                        './src/setup_jest_globals.ts',
                      ),
                    }
                  : pkg.name === 'jest-snapshot'
                    ? {worker: path.resolve(packageDir, './src/worker.ts')}
                    : {};

    const extraEntryPoints =
      // skip expect for now
      pkg.name === 'expect'
        ? {}
        : Object.keys(pkg.exports)
            .filter(
              key =>
                key !== '.' &&
                key !== './package.json' &&
                !key.startsWith('./bin'),
            )
            .reduce((previousValue, currentValue) => {
              return {
                ...previousValue,
                // skip `./`
                [currentValue.slice(2)]: path.resolve(
                  packageDir,
                  './src',
                  `${currentValue}.ts`,
                ),
              };
            }, {});

    return {
      packageDir,
      pkg,
      webpackConfig: {
        context: packageDir,
        devtool: false,
        entry: {
          index: input,
          ...separateChunks,
          ...extraEntryPoints,
        },
        externals: nodeExternals(),
        mode: 'production',
        module: {
          rules: [
            {
              test: /.ts$/,
              use: {
                loader: 'babel-loader',
                options,
              },
            },
          ],
        },
        optimization: {
          minimize: false,
          moduleIds: 'named',
        },
        output: {
          filename: '[name].js',
          library: {
            type: 'commonjs2',
          },
          path: path.resolve(packageDir, 'build'),
        },
        plugins: [
          new webpack.BannerPlugin(copyrightSnippet),
          new IgnoreDynamicRequire(separateChunks),
        ],
        resolve: {
          extensions: ['.ts', '.js'],
        },
        target: 'node',
      },
    };
  });
}

export function createWebpackConfigs(webpackConfigs = createBuildConfigs()) {
  return webpackConfigs
    .map(({webpackConfig}) => webpackConfig)
    .filter(config => config != null);
}

// inspired by https://framagit.org/Glandos/webpack-ignore-dynamic-require
class IgnoreDynamicRequire {
  constructor(extraEntries) {
    this.separateFiles = new Set(
      Object.keys(extraEntries).map(entry => `./${entry}`),
    );
  }

  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('IgnoreDynamicRequire', factory => {
      factory.hooks.parser
        .for('javascript/auto')
        .tap('IgnoreDynamicRequire', parser => {
          // This is a SyncBailHook, so returning anything stops the parser, and nothing (undefined) allows to continue
          parser.hooks.call
            .for('require')
            .tap('IgnoreDynamicRequire', expression => {
              if (expression.arguments.length === 0) {
                return undefined;
              }
              const arg = parser.evaluateExpression(expression.arguments[0]);
              if (arg.isString() && !arg.string.startsWith('.')) {
                return true;
              }
              if (!arg.isString() && !arg.isConditional()) {
                return true;
              }

              if (arg.isString() && this.separateFiles.has(arg.string)) {
                return true;
              }
              return undefined;
            });
          parser.hooks.call
            .for('require.resolve')
            .tap('IgnoreDynamicRequire', () => true);
          parser.hooks.call
            .for('require.resolve.paths')
            .tap('IgnoreDynamicRequire', () => true);
        });
    });
  }
}
