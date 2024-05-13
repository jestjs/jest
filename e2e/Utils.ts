/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as util from 'util';
import dedentBase from 'dedent';
import {
  type ExecaSyncError,
  type SyncOptions as ExecaSyncOptions,
  type ExecaSyncReturnValue,
  sync as spawnSync,
} from 'execa';
import * as fs from 'graceful-fs';
import which = require('which');
import type {Config} from '@jest/types';

const dedent = dedentBase.withOptions({escapeSpecialCharacters: true});

export const run = (
  cmd: string,
  cwd?: string,
  env?: Record<string, string>,
): ExecaSyncReturnValue => {
  const args = cmd.split(/\s/).slice(1);
  const spawnOptions: ExecaSyncOptions = {
    cwd,
    env,
    preferLocal: false,
    reject: false,
  };
  const result = spawnSync(cmd.split(/\s/)[0], args, spawnOptions);

  if (result.exitCode !== 0) {
    const errorResult = result as ExecaSyncError;

    // have to extract message for the `util.inspect` to be useful for some reason
    const {message, ...rest} = errorResult;

    errorResult.message += `\n\n${util.inspect(rest)}`;

    throw errorResult;
  }

  return result;
};

const yarnInstallImmutable = 'yarn install --immutable';
const yarnInstallNoImmutable = 'yarn install --no-immutable';

export const runYarnInstall = (cwd: string, env?: Record<string, string>) => {
  const lockfilePath = path.resolve(cwd, 'yarn.lock');
  let exists = true;

  // If the lockfile doesn't exist, yarn's project detection is confused. Just creating an empty file works
  if (!fs.existsSync(lockfilePath)) {
    exists = false;
    fs.writeFileSync(lockfilePath, '');
  }

  try {
    return run(
      exists ? yarnInstallImmutable : yarnInstallNoImmutable,
      cwd,
      env,
    );
  } catch (error) {
    try {
      // retry once in case of e.g. permission errors
      return run(
        fs.readFileSync(lockfilePath, 'utf8').trim().length > 0
          ? yarnInstallImmutable
          : yarnInstallNoImmutable,
        cwd,
        env,
      );
    } catch {
      throw error;
    }
  }
};

export const linkJestPackage = (packageName: string, cwd: string) => {
  const packagesDir = path.resolve(__dirname, '../packages');
  const packagePath = path.resolve(packagesDir, packageName);
  const destination = path.resolve(cwd, 'node_modules/', packageName);
  fs.mkdirSync(destination, {recursive: true});
  fs.rmSync(destination, {force: true, recursive: true});
  fs.symlinkSync(packagePath, destination, 'junction');
};

export const makeTemplate =
  (str: string): ((values?: Array<string>) => string) =>
  (values = []) =>
    str.replaceAll(/\$(\d+)/g, (_match, number) => {
      if (!Array.isArray(values)) {
        throw new TypeError('Array of values must be passed to the template.');
      }
      return values[number - 1];
    });

export const cleanup = (directory: string) => {
  try {
    fs.rmSync(directory, {force: true, recursive: true});
  } catch (error) {
    try {
      // retry once in case of e.g. permission errors
      fs.rmSync(directory, {force: true, recursive: true});
    } catch {
      throw error;
    }
  }
};

/**
 * Creates a nested directory with files and their contents
 * writeFiles(
 *   '/home/tmp',
 *   {
 *     'package.json': '{}',
 *     '__tests__/test.test.js': 'test("lol")',
 *   }
 * );
 */
export const writeFiles = (
  directory: string,
  files: {[filename: string]: string},
) => {
  fs.mkdirSync(directory, {recursive: true});
  for (const fileOrPath of Object.keys(files)) {
    const dirname = path.dirname(fileOrPath);

    if (dirname !== '/') {
      fs.mkdirSync(path.join(directory, dirname), {recursive: true});
    }
    fs.writeFileSync(
      path.resolve(directory, ...fileOrPath.split('/')),
      dedent(files[fileOrPath]),
    );
  }
};

export const writeSymlinks = (
  directory: string,
  symlinks: {[existingFile: string]: string},
) => {
  fs.mkdirSync(directory, {recursive: true});
  for (const fileOrPath of Object.keys(symlinks)) {
    const symLinkPath = symlinks[fileOrPath];
    const dirname = path.dirname(symLinkPath);

    if (dirname !== '/') {
      fs.mkdirSync(path.join(directory, dirname), {recursive: true});
    }
    fs.symlinkSync(
      path.resolve(directory, ...fileOrPath.split('/')),
      path.resolve(directory, ...symLinkPath.split('/')),
      'junction',
    );
  }
};

const NUMBER_OF_TESTS_TO_FORCE_USING_WORKERS = 25;
/**
 * Forces Jest to use workers by generating many test files to run.
 * Slow and modifies the test output. Use sparingly.
 */
export const generateTestFilesToForceUsingWorkers = () => {
  const testFiles: Record<string, string> = {};
  for (let i = 0; i <= NUMBER_OF_TESTS_TO_FORCE_USING_WORKERS; i++) {
    testFiles[`__tests__/test${i}.test.js`] = `
      test.todo('test ${i}');
    `;
  }
  return testFiles;
};

export const copyDir = (src: string, dest: string) => {
  const srcStat = fs.lstatSync(src);
  if (srcStat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).map(filePath =>
      copyDir(path.join(src, filePath), path.join(dest, filePath)),
    );
  } else {
    fs.writeFileSync(dest, fs.readFileSync(src));
  }
};

export const replaceSeed = (str: string) =>
  str.replaceAll(/Seed: {8}(-?\d+)/g, 'Seed:       <<REPLACED>>');

export const replaceTime = (str: string) =>
  str
    .replaceAll(/\d*\.?\d+ m?s\b/g, '<<REPLACED>>')
    .replaceAll(', estimated <<REPLACED>>', '');

// Since Jest does not guarantee the order of tests we'll sort the output.
export const sortLines = (output: string) =>
  output
    .split('\n')
    .sort()
    .map(str => str.trim())
    .join('\n');

export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  jest?: Config.InitialOptions;
}

const DEFAULT_PACKAGE_JSON: PackageJson = {
  jest: {
    testEnvironment: 'node',
  },
};

export const createEmptyPackage = (
  directory: string,
  packageJson: PackageJson = DEFAULT_PACKAGE_JSON,
) => {
  const packageJsonWithDefaults = {
    ...packageJson,
    description: 'THIS IS AN AUTOGENERATED FILE AND SHOULD NOT BE ADDED TO GIT',
  };
  fs.mkdirSync(directory, {recursive: true});
  fs.writeFileSync(
    path.resolve(directory, 'package.json'),
    JSON.stringify(packageJsonWithDefaults, null, 2),
  );
};

export const extractSummary = (stdout: string) => {
  const match = stdout
    .replaceAll(/(?:\\[nr])+/g, '\n')
    .match(
      /(Seed:.*\n)?Test Suites:.*\nTests.*\nSnapshots.*\nTime.*(\nRan all test suites)*.*\n*$/gm,
    );
  if (!match) {
    throw new Error(dedent`
      Could not find test summary in the output.
      OUTPUT:
        ${stdout}
    `);
  }

  const summary = replaceTime(match[0]);

  const rest = stdout
    .replace(match[0], '')
    // remove all timestamps
    .replaceAll(/\s*\(\d*\.?\d+ m?s\b\)$/gm, '');

  return {
    rest: rest.trim(),
    summary: summary.trim(),
  };
};

const sortTests = (stdout: string) =>
  stdout
    .split('\n')
    .reduce<Array<Array<string>>>((tests, line) => {
      if (['RUNS', 'PASS', 'FAIL'].includes(line.slice(0, 4))) {
        tests.push([line]);
      } else {
        tests.at(-1)!.push(line);
      }
      return tests;
    }, [])
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(strings =>
      strings.length > 1 ? `${strings.join('\n').trimEnd()}\n` : strings[0],
    )
    .join('\n')
    .trim();

export const extractSortedSummary = (stdout: string) => {
  const {rest, summary} = extractSummary(stdout);
  return {
    rest: sortTests(replaceTime(rest)),
    summary,
  };
};

export const extractSummaries = (
  stdout: string,
): Array<{rest: string; summary: string}> => {
  const regex =
    /(Seed:.*\n)?Test Suites:.*\nTests.*\nSnapshots.*\nTime.*(\nRan all test suites)*.*\n*$/gm;

  let match = regex.exec(stdout);
  const matches: Array<RegExpExecArray> = [];

  while (match) {
    matches.push(match);
    match = regex.exec(stdout);
  }

  return matches
    .map((currentMatch, i) => {
      const prevMatch = matches[i - 1];
      const start = prevMatch ? prevMatch.index + prevMatch[0].length : 0;
      const end = currentMatch.index + currentMatch[0].length;
      return {end, start};
    })
    .map(({start, end}) => extractSortedSummary(stdout.slice(start, end)));
};

// Certain environments (like CITGM and GH Actions) do not come with mercurial installed
let hgIsInstalled: boolean | null = null;

export const testIfHg = (...args: Parameters<typeof test>) => {
  if (hgIsInstalled === null) {
    hgIsInstalled = which.sync('hg', {nothrow: true}) !== null;
  }

  if (hgIsInstalled) {
    test(...args);
  } else {
    console.warn('Mercurial (hg) is not installed - skipping some tests');
    test.skip(...args);
  }
};

// Certain environments (like CITGM and GH Actions) do not come with sapling installed
let slIsInstalled: boolean | null = null;
export const testIfSl = (...args: Parameters<typeof test>) => {
  if (slIsInstalled === null) {
    slIsInstalled = which.sync('sl', {nothrow: true}) !== null;
  }

  if (slIsInstalled) {
    test(...args);
  } else {
    console.warn('Sapling (sl) is not installed - skipping some tests');
    test.skip(...args);
  }
};

export const testIfSlAndHg = (...args: Parameters<typeof test>) => {
  if (slIsInstalled === null) {
    slIsInstalled = which.sync('sl', {nothrow: true}) !== null;
  }
  if (hgIsInstalled === null) {
    hgIsInstalled = which.sync('hg', {nothrow: true}) !== null;
  }

  if (slIsInstalled && hgIsInstalled) {
    test(...args);
  } else {
    console.warn(
      'Sapling (sl) or Mercurial (hg) is not installed - skipping some tests',
    );
    test.skip(...args);
  }
};
