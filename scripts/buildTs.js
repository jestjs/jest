/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');
const chalk = require('chalk');
const execa = require('execa');
const globby = require('globby');
const stripJsonComments = require('strip-json-comments');
const throat = require('throat');
const {getPackages} = require('./buildUtils');

const readFilePromise = util.promisify(fs.readFile);

(async () => {
  const packages = getPackages();

  const packagesWithTs = packages.filter(p =>
    fs.existsSync(path.resolve(p, 'tsconfig.json')),
  );

  const {stdout: allWorkspacesString} = await execa('yarn', [
    'workspaces',
    'list',
    '--json',
  ]);

  const workspacesWithTs = new Map(
    JSON.parse(`[${allWorkspacesString.split('\n').join(',')}]`)
      .filter(({location}) =>
        packagesWithTs.some(pkg => pkg.endsWith(location)),
      )
      .map(({location, name}) => [name, location]),
  );

  packagesWithTs.forEach(pkgDir => {
    const pkg = require(`${pkgDir}/package.json`);

    assert.ok(pkg.types, `Package ${pkg.name} is missing \`types\` field`);

    assert.strictEqual(
      pkg.types,
      pkg.main.replace(/\.js$/, '.d.ts'),
      `\`main\` and \`types\` field of ${pkg.name} does not match`,
    );

    const jestDependenciesOfPackage = Object.keys(pkg.dependencies || {})
      .concat(Object.keys(pkg.devDependencies || {}))
      .filter(dep => workspacesWithTs.has(dep))
      .filter(dep => {
        // nothing should depend on these
        if (dep === 'jest-circus' || dep === 'jest-jasmine2') {
          return false;
        }

        // these are just `require.resolve`-ed
        if (pkg.name === 'jest-config') {
          if (dep === '@jest/test-sequencer' || dep === 'babel-jest') {
            return false;
          }
        }

        return true;
      })
      .map(dep =>
        path.relative(pkgDir, `${pkgDir}/../../${workspacesWithTs.get(dep)}`),
      )
      .sort();

    if (jestDependenciesOfPackage.length > 0) {
      const tsConfig = JSON.parse(
        stripJsonComments(fs.readFileSync(`${pkgDir}/tsconfig.json`, 'utf8')),
      );

      const references = tsConfig.references.map(({path}) => path);

      assert.deepStrictEqual(
        references,
        jestDependenciesOfPackage,
        `Expected declared references to match dependencies in packages ${
          pkg.name
        }. Got:\n\n${references.join(
          '\n',
        )}\nExpected:\n\n${jestDependenciesOfPackage.join('\n')}`,
      );
    }
  });

  const args = ['tsc', '-b', ...packagesWithTs, ...process.argv.slice(2)];

  console.log(chalk.inverse(' Building TypeScript definition files '));

  try {
    await execa('yarn', args, {stdio: 'inherit'});
    console.log(
      chalk.inverse.green(' Successfully built TypeScript definition files '),
    );
  } catch (e) {
    console.error(
      chalk.inverse.red(' Unable to build TypeScript definition files '),
    );
    throw e;
  }

  console.log(chalk.inverse(' Validating TypeScript definition files '));

  // we want to limit the number of processes we spawn
  const cpus = Math.max(1, os.cpus().length - 1);

  try {
    await Promise.all(
      packagesWithTs.map(
        throat(cpus, async pkgDir => {
          const buildDir = path.resolve(pkgDir, 'build/**/*.d.ts');
          const ts3dot4 = path.resolve(pkgDir, 'build/ts3.4');

          const globbed = await globby([buildDir, `!${ts3dot4}`]);

          const files = await Promise.all(
            globbed.map(file =>
              Promise.all([file, readFilePromise(file, 'utf8')]),
            ),
          );

          const filesWithTypeReferences = files
            .filter(([, content]) => content.includes('/// <reference types'))
            .filter(hit => hit.length > 0);

          const filesWithReferences = filesWithTypeReferences
            .map(([name, content]) => [
              name,
              content
                .split('\n')
                .filter(line => line !== '/// <reference types="node" />')
                .filter(line => line.includes('/// <reference types'))
                .join('\n'),
            ])
            .filter(([, content]) => content.length > 0)
            .filter(hit => hit.length > 0)
            .map(([file, references]) =>
              chalk.red(
                `${chalk.bold(
                  file,
                )} has the following non-node type references:\n\n${references}\n`,
              ),
            )
            .join('\n\n');

          if (filesWithReferences) {
            throw new Error(filesWithReferences);
          }

          const filesWithNodeReference = filesWithTypeReferences.map(
            ([filename]) => filename,
          );

          if (filesWithNodeReference.length > 0) {
            const pkg = require(pkgDir + '/package.json');

            assert.ok(
              pkg.dependencies,
              `Package \`${pkg.name}\` is missing \`dependencies\``,
            );
            assert.strictEqual(
              pkg.dependencies['@types/node'],
              '*',
              `Package \`${pkg.name}\` is missing a dependency on \`@types/node\``,
            );
          }
        }),
      ),
    );
  } catch (e) {
    console.error(
      chalk.inverse.red(' Unable to validate TypeScript definition files '),
    );

    throw e;
  }

  console.log(
    chalk.inverse.green(' Successfully validated TypeScript definition files '),
  );
})().catch(error => {
  console.error('Got error', error.stack);
  process.exitCode = 1;
});
