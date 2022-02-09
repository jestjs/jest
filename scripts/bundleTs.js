/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  CompilerState,
  Extractor,
  ExtractorConfig,
} = require('@microsoft/api-extractor');
const chalk = require('chalk');
const {sync: pkgDir} = require('pkg-dir');
const prettier = require('prettier');
const rimraf = require('rimraf');
const {getPackages} = require('./buildUtils');

const prettierConfig = prettier.resolveConfig.sync(
  __filename.replace(/\.js$/, '.d.ts'),
);

const typescriptCompilerFolder = pkgDir(require.resolve('typescript'));

const copyrightSnippet = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
`.trim();

(async () => {
  const packages = getPackages();

  const packagesWithTs = packages.filter(p =>
    fs.existsSync(path.resolve(p.packageDir, 'tsconfig.json')),
  );

  const typesNodeReferenceDirective = '/// <reference types="node" />';

  console.log(chalk.inverse(' Extracting TypeScript definition files '));

  const sharedExtractorConfig = {
    $schema:
      'https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json',

    apiReport: {
      enabled: false,
    },

    /**
     * A list of NPM package names whose exports should be treated as part of this package.
     */
    bundledPackages: [],

    compiler: {
      skipLibCheck: true,
    },

    docModel: {
      enabled: false,
    },

    dtsRollup: {
      enabled: true,
      untrimmedFilePath: '<projectFolder>/dist/index.d.ts',
    },

    messages: {
      compilerMessageReporting: {
        default: {
          logLevel: 'warning',
        },
      },

      extractorMessageReporting: {
        'ae-forgotten-export': {
          logLevel: 'none',
        },
        'ae-missing-release-tag': {
          logLevel: 'none',
        },
        default: {
          logLevel: 'warning',
        },
      },

      tsdocMessageReporting: {
        default: {
          logLevel: 'none',
        },
      },
    },

    tsdocMetadata: {
      enabled: false,
    },
  };

  await fs.promises.writeFile(
    path.resolve(__dirname, '../api-extractor.json'),
    JSON.stringify(sharedExtractorConfig, null, 2),
  );

  let compilerState;

  await Promise.all(
    packagesWithTs.map(async ({packageDir, pkg}) => {
      const configFile = path.resolve(packageDir, 'api-extractor.json');

      await fs.promises.writeFile(
        configFile,
        JSON.stringify(
          {
            extends: '../../api-extractor.json',
            mainEntryPointFilePath: path.resolve(packageDir, pkg.types),
            projectFolder: packageDir,
          },
          null,
          2,
        ),
      );
      const extractorConfig = ExtractorConfig.loadFileAndPrepare(configFile);

      if (!compilerState) {
        compilerState = CompilerState.create(extractorConfig, {
          additionalEntryPoints: packagesWithTs.map(({pkg, packageDir}) =>
            path.resolve(packageDir, pkg.types),
          ),
          typescriptCompilerFolder,
        });
      }

      const extractorResult = Extractor.invoke(extractorConfig, {
        compilerState,
        localBuild: true,
        showVerboseMessages: true,
        typescriptCompilerFolder,
      });

      if (!extractorResult.succeeded || extractorResult.warningCount > 0) {
        console.error(
          chalk.inverse.red(' Unable to extract TypeScript definition files '),
        );
        throw new Error(
          `API Extractor completed with ${extractorResult.errorCount} errors and ${extractorResult.warningCount} warnings`,
        );
      }

      const filepath = extractorResult.extractorConfig.untrimmedFilePath;

      let definitionFile = await fs.promises.readFile(filepath, 'utf8');

      rimraf.sync(path.resolve(packageDir, 'build/**/*.d.ts'));
      rimraf.sync(path.resolve(packageDir, 'dist/'));
      // this is invalid now, so remove it to not confuse `tsc`
      rimraf.sync(path.resolve(packageDir, 'tsconfig.tsbuildinfo'));

      definitionFile = definitionFile.replace(/\r\n/g, '\n');

      const hasNodeTypesReference = definitionFile.includes(
        typesNodeReferenceDirective,
      );

      if (hasNodeTypesReference) {
        definitionFile = [
          typesNodeReferenceDirective,
          ...definitionFile.split(typesNodeReferenceDirective),
        ].join('\n');
      }

      definitionFile = [
        copyrightSnippet,
        ...definitionFile.split(copyrightSnippet),
      ].join('\n');

      const formattedContent = prettier.format(definitionFile, {
        ...prettierConfig,
        filepath,
      });

      await fs.promises.writeFile(
        filepath.replace('/dist/', '/build/'),
        formattedContent,
      );
    }),
  );

  console.log(
    chalk.inverse.green(' Successfully extracted TypeScript definition files '),
  );
})().catch(error => {
  console.error('Got error', error.stack);
  process.exitCode = 1;
});
