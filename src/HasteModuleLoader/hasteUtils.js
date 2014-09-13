'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');
var _ = require('underscore');
var hasteLoaders = require('node-haste/lib/loaders');

var NodeHaste = require('node-haste/lib/Haste');

var constructHasteInst = _.memoize(
  function constructHasteInst(config, options) {
    options = options || {};

    if (!fs.existsSync(config.cacheDirectory)) {
      fs.mkdirSync(config.cacheDirectory);
    }

    return new NodeHaste(
      buildLoadersList(config),
      (config.testPathDirs || []),
      {
        ignorePaths: function(path) {
          return path.match(getHasteIgnoreRegex(config));
        },
        version: JSON.stringify(config),
        useNativeFind: true,
        maxProcesses: os.cpus().length,
        maxOpenFiles: options.maxOpenFiles || 100
      }
    );
  }
);

var buildLoadersList = _.memoize(function buildLoadersList(config) {
  return [
    new hasteLoaders.ProjectConfigurationLoader(),
    new hasteLoaders.JSTestLoader(config.setupJSTestLoaderOptions),
    new hasteLoaders.JSMockLoader(config.setupJSMockLoaderOptions),
    new hasteLoaders.JSLoader(config.setupJSLoaderOptions),
    new hasteLoaders.ResourceLoader()
  ];
});

var getCacheFilePath = _.memoize(function getCacheFilePath(config) {
  return path.join(config.cacheDirectory, 'cache-' + config.name);
});

var getHasteIgnoreRegex = _.memoize(
  function getHasteIgnoreRegex(config) {
    return new RegExp(
      config.modulePathIgnorePatterns.length > 0
      ? config.modulePathIgnorePatterns.join('|')
      : '$.'  // never matches
    );
  }
);

exports.buildLoadersList = buildLoadersList;
exports.constructHasteInst = constructHasteInst;
exports.getCacheFilePath = getCacheFilePath;
exports.getHasteIgnoreRegex = getHasteIgnoreRegex;
