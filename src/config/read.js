'use strict';

const fs = require('graceful-fs');
const loadConfigFromFile = require('./loadFromFile');
const normalizeConfig = require('./normalize');
const path = require('path');

function readConfig(argv, packageRoot) {
  return readRawConfig(argv, packageRoot).then(config => {
    if (argv.coverage) {
      config.collectCoverage = true;
    }

    if (argv.testEnvData) {
      config.testEnvData = argv.testEnvData;
    }

    config.noHighlight = argv.noHighlight || !process.stdout.isTTY;

    if (argv.verbose) {
      config.verbose = argv.verbose;
    }

    if (argv.bail) {
      config.bail = argv.bail;
    }

    if (argv.cache !== null) {
      config.cache = argv.cache;
    }

    if (argv.watchman !== null) {
      config.watchman = argv.watchman;
    }

    if (argv.useStderr) {
      config.useStderr = argv.useStderr;
    }

    if (argv.json) {
      config.useStderr = true;
    }

    if (argv.testRunner) {
      try {
        config.testRunner = require.resolve(
          argv.testRunner.replace(/<rootDir>/g, config.rootDir)
        );
      } catch (e) {
        throw new Error(
          `jest: testRunner path "${argv.testRunner}" is not a valid path.`
        );
      }
    }

    if (argv.logHeapUsage) {
      config.logHeapUsage = argv.logHeapUsage;
    }

    config.noStackTrace = argv.noStackTrace;

    return config;
  });
}

function readRawConfig(argv, packageRoot) {
  if (typeof argv.config === 'string') {
    return loadConfigFromFile(argv.config);
  }

  if (typeof argv.config === 'object') {
    return Promise.resolve(normalizeConfig(argv.config));
  }

  const pkgJsonPath = path.join(packageRoot, 'package.json');
  const pkgJson = fs.existsSync(pkgJsonPath) ? require(pkgJsonPath) : {};

  // Look to see if there is a package.json file with a jest config in it
  if (pkgJson.jest) {
    if (!pkgJson.jest.hasOwnProperty('rootDir')) {
      pkgJson.jest.rootDir = packageRoot;
    } else {
      pkgJson.jest.rootDir = path.resolve(packageRoot, pkgJson.jest.rootDir);
    }
    const config = normalizeConfig(pkgJson.jest);
    config.name = pkgJson.name;
    return Promise.resolve(config);
  }

  // Sane default config
  return Promise.resolve(normalizeConfig({
    name: packageRoot.replace(/[/\\]/g, '_'),
    rootDir: packageRoot,
    testPathDirs: [packageRoot],
    testPathIgnorePatterns: ['/node_modules/.+'],
  }));
}

module.exports = readConfig;
