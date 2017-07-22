/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const {spawnSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const run = (cmd, cwd) => {
  const args = cmd.split(/\s/).slice(1);
  const spawnOptions = {cwd};
  const result = spawnSync(cmd.split(/\s/)[0], args, spawnOptions);

  if (result.status !== 0) {
    const message = `
      ORIGINAL CMD: ${cmd}
      STDOUT: ${result.stdout && result.stdout.toString()}
      STDERR: ${result.stderr && result.stderr.toString()}
      STATUS: ${result.status}
      ERROR: ${result.error}
    `;
    throw new Error(message);
  }

  result.stdout = result.stdout && result.stdout.toString();
  result.stderr = result.stderr && result.stderr.toString();

  return result;
};

const linkJestPackage = (packageName, cwd) => {
  const packagesDir = path.resolve(__dirname, '../packages');
  const packagePath = path.resolve(packagesDir, packageName);
  const destination = path.resolve(cwd, 'node_modules/');
  run(`mkdir -p ${destination}`);
  return run(`ln -sf ${packagePath} ${destination}`);
};

const fileExists = filePath => {
  try {
    fs.accessSync(filePath, fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
};

const makeTemplate = string => {
  return values => {
    return string.replace(/\$(\d+)/g, (match, number) => {
      return values[number - 1];
    });
  };
};

const cleanup = (directory: string) => rimraf.sync(directory);

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
const writeFiles = (directory: string, files: {[filename: string]: string}) => {
  mkdirp.sync(directory);
  Object.keys(files).forEach(fileOrPath => {
    const filePath = fileOrPath.split(path.sep); // ['tmp', 'a.js']
    const filename = filePath.pop(); // filepath becomes dirPath (no filename)

    if (filePath.length) {
      mkdirp.sync(path.join.apply(path, [directory].concat(filePath)));
    }
    fs.writeFileSync(
      path.resolve.apply(path, [directory].concat(filePath, [filename])),
      files[fileOrPath],
    );
  });
};

const copyDir = (src: string, dest: string) => {
  const srcStat = fs.lstatSync(src);
  if (srcStat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).map(filePath => {
      return copyDir(path.join(src, filePath), path.join(dest, filePath));
    });
  } else {
    fs.writeFileSync(dest, fs.readFileSync(src));
  }
};

const createEmptyPackage = (directory, packageJson) => {
  const DEFAULT_PACKAGE_JSON = {
    description: 'THIS IS AN AUTOGENERATED FILE AND SHOULD NOT BE ADDED TO GIT',
    jest: {
      testEnvironment: 'node',
    },
  };

  mkdirp.sync(directory);
  packageJson || (packageJson = DEFAULT_PACKAGE_JSON);
  fs.writeFileSync(
    path.resolve(directory, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  );
};

const extractSummary = stdout => {
  const match = stdout.match(
    /Test Suites:.*\nTests.*\nSnapshots.*\nTime.*(\nRan all test suites)*.*\n*$/gm,
  );
  if (!match) {
    throw new Error(
      `
      Could not find test summary in the output.
      OUTPUT:
        ${stdout}
    `,
    );
  }

  const summary = match[0]
    .replace(/\d*\.?\d+m?s/g, '<<REPLACED>>')
    .replace(/, estimated <<REPLACED>>/g, '');

  const rest = cleanupStackTrace(
    // remove all timestamps
    stdout.slice(0, -match[0].length).replace(/\s*\(.*ms\)/gm, ''),
  );

  return {rest, summary};
};

// different versions of Node print different stack traces. This function
// unifies their output to make it possible to snapshot them.
const cleanupStackTrace = (output: string) => {
  return output
    .replace(/\n.*at.*timers\.js.*$/gm, '')
    .replace(/\n.*at.*assert\.js.*$/gm, '')
    .replace(/\n.*at.*node\.js.*$/gm, '')
    .replace(/\n.*at.*next_tick\.js.*$/gm, '')
    .replace(/\n.*at Promise \(<anonymous>\).*$/gm, '')
    .replace(/\n.*at <anonymous>.*$/gm, '')
    .replace(/\n.*at Generator.next \(<anonymous>\).*$/gm, '')
    .replace(/^.*at.*[\s][\(]?(\S*\:\d*\:\d*).*$/gm, '      at $1');
};

module.exports = {
  cleanup,
  cleanupStackTrace,
  copyDir,
  createEmptyPackage,
  extractSummary,
  fileExists,
  linkJestPackage,
  makeTemplate,
  run,
  writeFiles,
};
