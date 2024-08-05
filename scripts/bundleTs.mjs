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
import {ESLint} from 'eslint';
import {glob} from 'glob';
import fs from 'graceful-fs';
import pico from 'picocolors';
import pkgDir from 'pkg-dir';
import {rimraf} from 'rimraf';
import {copyrightSnippet, getPackagesWithTsConfig} from './buildUtils.mjs';

const require = createRequire(import.meta.url);
const typescriptCompilerFolder = await pkgDir(require.resolve('typescript'));

const typesNodeReferenceDirective = '/// <reference types="node" />';

const excludedPackages = new Set(['@jest/globals', '@jest/test-globals']);

const packagesToBundle = getPackagesWithTsConfig().filter(
  p => !excludedPackages.has(p.pkg.name),
);

console.log(pico.inverse(' Extracting TypeScript definition files '));

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

const eslint = new ESLint({
  cwd: process.cwd(),
  fix: true,
  overrideConfig: {
    rules: {
      // `d.ts` files are by nature `type` only imports, so it's just noise when looking at the file
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {prefer: 'no-type-imports'},
      ],
    },
  },
});

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
        pico.inverse(
          pico.red(' Unable to extract TypeScript definition files '),
        ),
      );
      throw new Error(
        `API Extractor completed with ${extractorResult.errorCount} errors and ${extractorResult.warningCount} warnings`,
      );
    }

    const filepath = extractorResult.extractorConfig.untrimmedFilePath;

    let definitionFile = await fs.promises.readFile(filepath, 'utf8');

    await rimraf(path.resolve(packageDir, 'build/**/*.d.ts'), {glob: true});
    await fs.promises.rm(path.resolve(packageDir, 'dist/'), {
      force: true,
      recursive: true,
    });
    // this is invalid now, so remove it to not confuse `tsc`
    await fs.promises.rm(path.resolve(packageDir, 'tsconfig.tsbuildinfo'), {
      force: true,
      recursive: true,
    });

    const dirsInBuild = await glob('**/', {
      cwd: path.resolve(packageDir, 'build'),
    });

    await Promise.all(
      dirsInBuild
        .filter(dir => dir !== '.')
        // reverse to delete deep directories first
        .reverse()
        .map(async dir => {
          const dirToDelete = path.resolve(packageDir, 'build', dir);
          try {
            await fs.promises.rmdir(dirToDelete);
          } catch (error) {
            // e.g. `jest-jasmine2/build/jasmine` is not empty - ignore those errors
            if (error.code !== 'ENOTEMPTY') {
              throw error;
            }
          }
        }),
    );

    definitionFile = definitionFile.replaceAll('\r\n', '\n');

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
      '',
      ...definitionFile.split(copyrightSnippet),
    ].join('\n');

    const [lintResult] = await eslint.lintText(definitionFile, {
      filePath: 'some-file.ts',
    });

    // if the autofixer did anything, the result is in `output`
    const formattedContent = lintResult.output || definitionFile;

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
  pico.inverse(
    pico.green(' Successfully extracted TypeScript definition files '),
  ),
);
