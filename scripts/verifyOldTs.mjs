/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createRequire} from 'module';
import * as path from 'path';
import {fileURLToPath} from 'url';
import chalk from 'chalk';
import execa from 'execa';
import fs from 'graceful-fs';
import stripJsonComments from 'strip-json-comments';
import tempy from 'tempy';
const require = createRequire(import.meta.url);

const baseTsConfig = JSON.parse(
  stripJsonComments(
    fs.readFileSync(require.resolve('../tsconfig.json'), 'utf8'),
  ),
);

/* eslint-disable sort-keys */
const tsConfig = {
  extends: baseTsConfig.extends,
  compilerOptions: {
    esModuleInterop: false,
    module: 'commonjs',
    moduleResolution: 'node',
    noEmit: true,
  },
};
/* eslint-enable */

const tsVersion = '4.3';

function smoketest() {
  const jestDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../packages/jest',
  );

  const cwd = tempy.directory();

  try {
    fs.writeFileSync(
      path.join(cwd, '.yarnrc.yml'),
      'nodeLinker: node-modules\n',
    );
    execa.sync('yarn', ['init', '--yes'], {cwd, stdio: 'inherit'});
    execa.sync(
      'yarn',
      // TODO: do not set version of @tsconfig/node14 after we upgrade to a version of TS that supports `"moduleResolution": "node16"` (https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/)
      ['add', `typescript@~${tsVersion}`, '@tsconfig/node14@1'],
      {cwd, stdio: 'inherit'},
    );
    fs.writeFileSync(
      path.join(cwd, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2),
    );
    fs.writeFileSync(
      path.join(cwd, 'index.ts'),
      `import jest = require('${jestDirectory}');`,
    );
    execa.sync('yarn', ['tsc', '--project', '.'], {cwd, stdio: 'inherit'});

    console.log(
      chalk.inverse.green(
        ` Successfully compiled Jest with TypeScript ${tsVersion} `,
      ),
    );
  } finally {
    fs.rmSync(cwd, {force: true, recursive: true});
  }
}

function typeTests() {
  const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../');
  const rootPackageJson = require('../package.json');

  const currentTsdTypescriptVersion =
    rootPackageJson.devDependencies['@tsd/typescript'];
  const currentTypescriptVersion =
    rootPackageJson.devDependencies['typescript'];
  const apiExtractorTypescriptVersion =
    require('@microsoft/api-extractor/package.json').dependencies['typescript'];

  try {
    const {stdout: statusStdout} = execa.sync(
      'git',
      ['status', '--porcelain'],
      {cwd},
    );

    if (statusStdout.length > 0) {
      throw new Error(
        'Repo is not clean - cannot run type tests with old typescript version',
      );
    }

    // TODO: do not set version of @tsconfig/node14 after we upgrade to a version of TS that supports `"moduleResolution": "node16"` (https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/)
    execa.sync('yarn', ['add', '@tsconfig/node14@1'], {cwd});

    execa.sync(
      'yarn',
      [
        'set',
        'resolution',
        `@tsd/typescript@npm:${currentTsdTypescriptVersion}`,
        tsVersion,
      ],
      {cwd},
    );

    verifyInstalledTsdTypescript();

    execa.sync(
      'yarn',
      [
        'set',
        'resolution',
        `typescript@npm:${currentTypescriptVersion}`,
        tsVersion,
      ],
      {cwd},
    );
    execa.sync(
      'yarn',
      [
        'set',
        'resolution',
        `typescript@npm:${apiExtractorTypescriptVersion}`,
        tsVersion,
      ],
      {cwd},
    );
    execa.sync('yarn', ['set', 'resolution', 'typescript@npm:*', tsVersion], {
      cwd,
    });

    verifyInstalledTypescript();

    execa.sync('yarn', ['test-types'], {cwd, stdio: 'inherit'});
  } finally {
    execa.sync('git', ['checkout', 'package.json', 'yarn.lock'], {cwd});
    execa.sync('yarn', ['install'], {cwd});
  }

  function verifyInstalledTsdTypescript() {
    const tsdEntries = listInstalledVersion('@tsd/typescript');

    if (tsdEntries.length !== 1) {
      throw new Error(
        `More than one version of @tsd/typescript found: ${tsdEntries.join(
          ', ',
        )}`,
      );
    }

    const tsdVersion = tsdEntries[0].match(/@npm:(\d+\.\d+)\.\d+/);

    if (!tsdVersion) {
      throw new Error('Unable to verify installed version of @tsd/typescript');
    }

    if (tsdVersion[1] !== tsVersion) {
      throw new Error(
        `Installed TSD version is not ${tsVersion}, is ${tsdVersion[1]}`,
      );
    }
  }

  function verifyInstalledTypescript() {
    const typescriptEntries = listInstalledVersion('typescript');

    if (typescriptEntries.length !== 1) {
      throw new Error(
        `More than one version of typescript found: ${typescriptEntries.join(
          ', ',
        )}`,
      );
    }

    const tsdVersion = typescriptEntries[0].match(/@npm%3A(\d+\.\d+)\.\d+/);

    if (!tsdVersion) {
      throw new Error('Unable to verify installed version of typescript');
    }

    if (tsdVersion[1] !== tsVersion) {
      throw new Error(
        `Installed TSD version is not ${tsVersion}, is ${tsdVersion[1]}`,
      );
    }
  }

  function listInstalledVersion(module) {
    const {stdout: tsdWhyOutput} = execa.sync(
      'yarn',
      ['why', module, '--json'],
      {cwd},
    );

    const locators = tsdWhyOutput
      .split('\n')
      .map(JSON.parse)
      .map(entry => {
        const entries = Object.entries(entry.children);
        if (entries.length !== 1) {
          throw new Error(
            `More than one entry found in ${JSON.stringify(entry, null, 2)}`,
          );
        }

        return entries[0][1].locator;
      });

    return Array.from(new Set(locators));
  }
}

console.log(chalk.inverse(` Running smoketest using TypeScript@${tsVersion} `));
smoketest();
console.log(chalk.inverse.green(' Successfully ran smoketest '));

console.log(
  chalk.inverse(` Running type tests using TypeScript@${tsVersion} `),
);
typeTests();
console.log(chalk.inverse.green(' Successfully ran type tests '));
