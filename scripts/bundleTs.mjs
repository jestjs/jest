/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createRequire} from 'module';
import * as path from 'path';
import {fileURLToPath} from 'url';
import {
  CompilerState,
  Extractor,
  ExtractorConfig,
} from '@microsoft/api-extractor';
import chalk from 'chalk';
import fs from 'graceful-fs';
import {sync as pkgDir} from 'pkg-dir';
import prettier from 'prettier';
import {rimraf} from 'rimraf';
import {getPackages} from './buildUtils.mjs';

const prettierConfig = prettier.resolveConfig.sync(
  fileURLToPath(import.meta.url).replace(/\.js$/, '.d.ts'),
);

const require = createRequire(import.meta.url);
const typescriptCompilerFolder = pkgDir(require.resolve('typescript'));

const copyrightSnippet = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
`.trim();

const typesNodeReferenceDirective = '/// <reference types="node" />';

const excludedPackages = new Set(['@jest/globals', '@jest/test-globals']);

const packages = getPackages();

const isTsPackage = p =>
  fs.existsSync(path.resolve(p.packageDir, 'tsconfig.json'));

const packagesToBundle = packages.filter(
  p => isTsPackage(p) && !excludedPackages.has(p.pkg.name),
);

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
  path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../api-extractor.json',
  ),
  JSON.stringify(sharedExtractorConfig, null, 2),
);

let compilerState;

await Promise.all(
  packagesToBundle.map(async ({packageDir, pkg}) => {
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
        additionalEntryPoints: packagesToBundle.map(({pkg, packageDir}) =>
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

    rimraf.sync(path.resolve(packageDir, 'build/**/*.d.ts'), {glob: true});
    fs.rmSync(path.resolve(packageDir, 'dist/'), {
      force: true,
      recursive: true,
    });
    // this is invalid now, so remove it to not confuse `tsc`
    fs.rmSync(path.resolve(packageDir, 'tsconfig.tsbuildinfo'), {
      force: true,
      recursive: true,
    });

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
      filepath.replace(
        `${path.sep}dist${path.sep}`,
        `${path.sep}build${path.sep}`,
      ),
      formattedContent,
    );
  }),
);

console.log(
  chalk.inverse.green(' Successfully extracted TypeScript definition files '),
);
