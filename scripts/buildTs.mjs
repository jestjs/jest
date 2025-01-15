/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {strict as assert} from 'assert';
import * as os from 'os';
import * as path from 'path';
import execa from 'execa';
import {glob} from 'glob';
import fs from 'graceful-fs';
import pLimit from 'p-limit';
import pico from 'picocolors';
import stripJsonComments from 'strip-json-comments';
import {getPackagesWithTsConfig} from './buildUtils.mjs';

const packagesWithTs = getPackagesWithTsConfig();

const {stdout: allWorkspacesString} = await execa('yarn', [
  'workspaces',
  'list',
  '--json',
]);

const workspacesWithTs = new Map(
  JSON.parse(`[${allWorkspacesString.split('\n').join(',')}]`)
    .filter(({location}) =>
      packagesWithTs.some(({packageDir}) => packageDir.endsWith(location)),
    )
    .map(({location, name}) => [name, location]),
);

for (const {packageDir, pkg} of packagesWithTs) {
  assert.ok(pkg.types, `Package ${pkg.name} is missing \`types\` field`);

  assert.strictEqual(
    pkg.types,
    pkg.main.replace(/\.js$/, '.d.ts'),
    `\`main\` and \`types\` field of ${pkg.name} does not match`,
  );

  const jestDependenciesOfPackage = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ]
    .filter(dep => {
      if (!workspacesWithTs.has(dep)) {
        return false;
      }

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

      // only test files depend on '@jest/test-utils', i.e. it is always a dev dependency
      // see additional checks below
      if (dep === '@jest/test-utils') {
        return false;
      }

      return true;
    })
    .map(dep =>
      path.relative(
        packageDir,
        `${packageDir}/../../${workspacesWithTs.get(dep)}`,
      ),
    )
    .sort();

  if (jestDependenciesOfPackage.length > 0) {
    const tsConfig = JSON.parse(
      stripJsonComments(fs.readFileSync(`${packageDir}/tsconfig.json`, 'utf8')),
    );

    const references = tsConfig.references.map(({path}) => path);

    assert.deepStrictEqual(
      references,
      jestDependenciesOfPackage,
      `Expected declared references to match dependencies in package ${
        pkg.name
      }. Got:\n\n${references.join(
        '\n',
      )}\nExpected:\n\n${jestDependenciesOfPackage.join('\n')}`,
    );
  }

  let hasJestTestUtils = Object.keys(pkg.dependencies || {}).includes(
    '@jest/test-utils',
  );

  if (hasJestTestUtils) {
    throw new Error(
      pico.red(
        `Package '${pkg.name}' declares '@jest/test-utils' as dependency, but it must be declared as dev dependency`,
      ),
    );
  }

  hasJestTestUtils = Object.keys(pkg.devDependencies || {}).includes(
    '@jest/test-utils',
  );

  const tsConfigPaths = glob.sync('**/__tests__/tsconfig.json', {
    absolute: true,
    cwd: packageDir,
  });

  const testUtilsReferences = tsConfigPaths.filter(tsConfigPath => {
    const tsConfig = JSON.parse(
      stripJsonComments(fs.readFileSync(tsConfigPath, 'utf8')),
    );

    return tsConfig.references.some(
      ({path}) => path && path.endsWith('test-utils'),
    );
  });

  if (hasJestTestUtils && testUtilsReferences.length === 0) {
    throw new Error(
      pico.red(
        `Package '${
          pkg.name
        }' declares '@jest/test-utils' as dev dependency, but it is not referenced in:\n\n${tsConfigPaths.join(
          '\n',
        )}`,
      ),
    );
  }

  if (!hasJestTestUtils && testUtilsReferences.length > 0) {
    throw new Error(
      pico.red(
        `Package '${
          pkg.name
        }' does not declare '@jest/test-utils' as dev dependency, but it is referenced in:\n\n${testUtilsReferences.join(
          '\n',
        )}`,
      ),
    );
  }
}

const args = [
  'tsc',
  '-b',
  ...packagesWithTs.map(({packageDir}) => packageDir),
  ...process.argv.slice(2),
];

console.log(pico.inverse(' Building TypeScript definition files '));

try {
  await execa('yarn', args, {stdio: 'inherit'});
  console.log(
    pico.inverse(
      pico.green(' Successfully built TypeScript definition files '),
    ),
  );
} catch (error) {
  console.error(
    pico.inverse(pico.red(' Unable to build TypeScript definition files ')),
  );
  throw error;
}

console.log(pico.inverse(' Validating TypeScript definition files '));

// we want to limit the number of processes we spawn
const cpus = Math.max(
  1,
  (typeof os.availableParallelism === 'function'
    ? os.availableParallelism()
    : os.cpus().length) - 1,
);

const typesReferenceDirective = '/// <reference types';
const typesNodeReferenceDirective = `${typesReferenceDirective}="node" />`;

try {
  const mutex = pLimit(cpus);
  await Promise.all(
    packagesWithTs.map(({packageDir, pkg}) =>
      mutex(async () => {
        const matched = glob.sync('build/**/*.d.ts', {
          absolute: true,
          cwd: packageDir,
        });

        const files = await Promise.all(
          matched.map(file =>
            Promise.all([file, fs.promises.readFile(file, 'utf8')]),
          ),
        );

        const filesWithTypeReferences = files
          .filter(([, content]) => content.includes(typesReferenceDirective))
          .filter(hit => hit.length > 0);

        const filesWithReferences = filesWithTypeReferences
          .map(([name, content]) => [
            name,
            content
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.includes(typesReferenceDirective))
              .filter(line => line !== typesNodeReferenceDirective)
              .join('\n'),
          ])
          .filter(([, content]) => content.length > 0)
          .filter(hit => hit.length > 0)
          .map(([file, references]) =>
            pico.red(
              `${pico.bold(
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
} catch (error) {
  console.error(
    pico.inverse(pico.red(' Unable to validate TypeScript definition files ')),
  );

  throw error;
}

console.log(
  pico.inverse(
    pico.green(' Successfully validated TypeScript definition files '),
  ),
);
