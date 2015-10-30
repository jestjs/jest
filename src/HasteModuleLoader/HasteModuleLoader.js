/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

 /* eslint-disable fb-www/require-args */
'use strict';

const fs = require('graceful-fs');
const hasteLoaders = require('node-haste/lib/loaders');
const mkdirp = require('mkdirp');
const moduleMocker = require('../lib/moduleMocker');
const NodeHaste = require('node-haste/lib/Haste');
const os = require('os');
const path = require('path');
const resolve = require('resolve');
const transform = require('../lib/transform');
const utils = require('../lib/utils');

const COVERAGE_STORAGE_VAR_NAME = '____JEST_COVERAGE_DATA____';
const NODE_PATH = process.env.NODE_PATH;
const IS_PATH_BASED_MODULE_NAME = /^(?:\.\.?\/|\/)/;
const VENDOR_PATH = path.resolve(__dirname, '../../vendor');
const NODE_CORE_MODULES = {
  assert: true,
  buffer: true,
  child_process: true,
  cluster: true,
  console: true,
  constants: true,
  crypto: true,
  dgram: true,
  dns: true,
  domain: true,
  events: true,
  freelist: true,
  fs: true,
  http: true,
  https: true,
  module: true,
  net: true,
  os: true,
  path: true,
  punycode: true,
  querystring: true,
  readline: true,
  repl: true,
  smalloc: true,
  stream: true,
  string_decoder: true,
  sys: true,
  timers: true,
  tls: true,
  tty: true,
  url: true,
  util: true,
  vm: true,
  zlib: true,
};

const mockParentModule = {
  id: 'mockParent',
  exports: {},
};

const hasOwnProperty = Object.prototype.hasOwnProperty;

let _configUnmockListRegExpCache = null;

function _buildLoadersList(config) {
  return [
    new hasteLoaders.ProjectConfigurationLoader(),
    new hasteLoaders.JSTestLoader(config.setupJSTestLoaderOptions),
    new hasteLoaders.JSMockLoader(config.setupJSMockLoaderOptions),
    new hasteLoaders.JSLoader(config.setupJSLoaderOptions),
    new hasteLoaders.ResourceLoader(),
  ];
}

function _constructHasteInst(config, options) {
  const HASTE_IGNORE_REGEX = new RegExp(
    [config.cacheDirectory].concat(config.modulePathIgnorePatterns).join('|')
  );

  // Support npm package scopes that add an extra directory to the path
  const scopedCacheDirectory = path.dirname(_getCacheFilePath(config));
  if (!fs.existsSync(scopedCacheDirectory)) {
    mkdirp.sync(scopedCacheDirectory, {mode: '777', fs});
  }

  return new NodeHaste(_buildLoadersList(config), (config.testPathDirs || []), {
    ignorePaths: path => path.match(HASTE_IGNORE_REGEX),
    version: JSON.stringify(config),
    useNativeFind: true,
    maxProcesses: options.maxWorkers || os.cpus().length,
    maxOpenFiles: options.maxOpenFiles || 100,
  });
}

function _getCacheFilePath(config) {
  return path.join(config.cacheDirectory, 'cache-' + config.name);
}

class Loader {
  constructor(config, environment, resourceMap) {
    this._config = config;
    this._coverageCollectors = {};
    this._currentlyExecutingModulePath = '';
    this._environment = environment;
    this._explicitShouldMock = {};
    this._explicitlySetMocks = {};
    this._isCurrentlyExecutingManualMock = null;
    this._mockMetaDataCache = {};
    this._nodeModuleProjectConfigNameToResource = null;
    this._resourceMap = resourceMap;
    this._reverseDependencyMap = null;
    this._shouldAutoMock = true;
    this._configShouldMockModuleNames = {};

    if (config.collectCoverage) {
      this._CoverageCollector = require(config.coverageCollector);
    }

    if (_configUnmockListRegExpCache === null) {
      _configUnmockListRegExpCache = new WeakMap();
    }

    if (
      !config.unmockedModulePathPatterns ||
      config.unmockedModulePathPatterns.length === 0
    ) {
      this._unmockListRegExps = [];
    } else {
      this._unmockListRegExps = _configUnmockListRegExpCache.get(config);
      if (!this._unmockListRegExps) {
        this._unmockListRegExps = config.unmockedModulePathPatterns
          .map(unmockPathRe => new RegExp(unmockPathRe));
        _configUnmockListRegExpCache.set(config, this._unmockListRegExps);
      }
    }

    // Workers communicate the config as JSON so we have to create a regex
    // object in the module loader instance.
    this._mappedModuleNames = Object.create(null);
    if (this._config.moduleNameMapper.length) {
      this._config.moduleNameMapper.forEach(
        map => this._mappedModuleNames[map[1]] = new RegExp(map[0])
      );
    }

    this.resetModuleRegistry();
  }

  static loadResourceMap(config, options) {
    return new Promise((resolve, reject) => {
      try {
        _constructHasteInst(config, options || {}).update(
          _getCacheFilePath(config),
          resolve
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  static loadResourceMapFromCacheFile(config, options) {
    return new Promise((resolve, reject) => {
      try {
        const hasteInst = _constructHasteInst(config, options || {});
        hasteInst.loadMap(_getCacheFilePath(config), (err, map) => {
          if (err) {
            reject(err);
          } else {
            resolve(map);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Given the path to a module: Read it from disk (synchronously) and
   * evaluate it's constructor function to generate the module and exports
   * objects.
   */
  _execModule(moduleObj) {
    const modulePath = moduleObj.__filename;
    let moduleContent = transform(modulePath, this._config);

    // Every module, if loaded for jest, should have a parent
    // so they don't think they are run standalone
    moduleObj.parent = mockParentModule;
    moduleObj.require = this.constructBoundRequire(modulePath);

    const moduleLocalBindings = {
      module: moduleObj,
      exports: moduleObj.exports,
      require: moduleObj.require,
      __dirname: path.dirname(modulePath),
      __filename: modulePath,
      global: this._environment.global,
      jest: this._createRuntimeFor(modulePath),
    };

    const onlyCollectFrom = this._config.collectCoverageOnlyFrom;
    const shouldCollectCoverage =
      this._config.collectCoverage === true && !onlyCollectFrom
      || (onlyCollectFrom && onlyCollectFrom[modulePath] === true);

    if (shouldCollectCoverage) {
      if (!hasOwnProperty.call(this._coverageCollectors, modulePath)) {
        this._coverageCollectors[modulePath] =
          new this._CoverageCollector(moduleContent, modulePath);
      }
      const collector = this._coverageCollectors[modulePath];
      moduleLocalBindings[COVERAGE_STORAGE_VAR_NAME] =
        collector.getCoverageDataStore();
      moduleContent =
        collector.getInstrumentedSource(COVERAGE_STORAGE_VAR_NAME);
    }

    const lastExecutingModulePath = this._currentlyExecutingModulePath;
    this._currentlyExecutingModulePath = modulePath;

    const origCurrExecutingManualMock = this._isCurrentlyExecutingManualMock;
    this._isCurrentlyExecutingManualMock = modulePath;

    utils.runContentWithLocalBindings(
      this._environment,
      moduleContent,
      modulePath,
      moduleLocalBindings
    );

    this._isCurrentlyExecutingManualMock = origCurrExecutingManualMock;
    this._currentlyExecutingModulePath = lastExecutingModulePath;
  }

  _generateMock(currPath, moduleName) {
    const modulePath = this._moduleNameToPath(currPath, moduleName);

    if (!hasOwnProperty.call(this._mockMetaDataCache, modulePath)) {
      // This allows us to handle circular dependencies while generating an
      // automock
      this._mockMetaDataCache[modulePath] = moduleMocker.getMetadata({});

      // In order to avoid it being possible for automocking to potentially
      // cause side-effects within the module environment, we need to execute
      // the module in isolation. This accomplishes that by temporarily
      // clearing out the module and mock registries while the module being
      // analyzed is executed.
      //
      // An example scenario where this could cause issue is if the module being
      // mocked has calls into side-effectful APIs on another module.
      const origMockRegistry = this._mockRegistry;
      const origModuleRegistry = this._moduleRegistry;
      this._mockRegistry = {};
      this._moduleRegistry = {};

      const moduleExports = this.requireModule(currPath, moduleName);

      // Restore the "real" module/mock registries
      this._mockRegistry = origMockRegistry;
      this._moduleRegistry = origModuleRegistry;

      this._mockMetaDataCache[modulePath] = moduleMocker.getMetadata(
        moduleExports
      );
    }

    return moduleMocker.generateFromMetadata(
      this._mockMetaDataCache[modulePath]
    );
  }

  _getDependencyPathsFromResource(resource) {
    const dependencyPaths = [];
    for (let i = 0; i < resource.requiredModules.length; i++) {
      let requiredModule = resource.requiredModules[i];

      // *facepalm* node-haste is pretty clowny
      if (resource.getModuleIDByOrigin) {
        requiredModule =
          resource.getModuleIDByOrigin(requiredModule) || requiredModule;
      }

      let moduleID;
      try {
        moduleID = this._getNormalizedModuleID(resource.path, requiredModule);
      } catch (e) {
        continue;
      }

      dependencyPaths.push(this._getRealPathFromNormalizedModuleID(moduleID));
    }
    return dependencyPaths;
  }

  _getResource(resourceType, resourceName) {
    let resource = this._resourceMap.getResource(resourceType, resourceName);

    if (
      resource === undefined &&
      resourceType === 'JS' &&
      /\//.test(resourceName) &&
      !/\.js$/.test(resourceName)
    ) {
      resource = this._resourceMap.getResource(
        resourceType,
        resourceName + '.js'
      );
    }

    if (
      resource === undefined &&
      resourceType === 'JSMock'
    ) {
      const moduleName = this._resolveStubModuleName(resourceName);
      if (moduleName) {
        resource = this._resourceMap.getResource('JS', moduleName);
      }
    }

    return resource;
  }

  _getNormalizedModuleID(currPath, moduleName) {
    let moduleType;
    let mockAbsPath = null;
    let realAbsPath = null;

    if (hasOwnProperty.call(NODE_CORE_MODULES, moduleName)) {
      moduleType = 'node';
      realAbsPath = moduleName;
    } else {
      moduleType = 'user';
      if (
        IS_PATH_BASED_MODULE_NAME.test(moduleName) ||
        (
          this._getResource('JS', moduleName) === undefined &&
          this._getResource('JSMock', moduleName) === undefined
        )
      ) {
        const absolutePath = this._moduleNameToPath(currPath, moduleName);
        if (absolutePath === undefined) {
          throw new Error(
            `Cannot find module '${moduleName}' from '${currPath}'`
          );
        }

        // See if node-haste is already aware of this resource. If so, we need
        // to look up if it has an associated manual mock.
        const resource = this._resourceMap.getResourceByPath(absolutePath);
        if (resource) {
          if (resource.type === 'JS') {
            realAbsPath = absolutePath;
          } else if (resource.type === 'JSMock') {
            mockAbsPath = absolutePath;
          }
          moduleName = resource.id;
        }
      }

      if (realAbsPath === null) {
        const moduleResource = this._getResource('JS', moduleName);
        if (moduleResource) {
          realAbsPath = moduleResource.path;
        }
      }

      if (mockAbsPath === null) {
        const mockResource = this._getResource('JSMock', moduleName);
        if (mockResource) {
          mockAbsPath = mockResource.path;
        }
      }
    }

    const delimiter = path.delimiter;
    return moduleType + delimiter + realAbsPath + delimiter + mockAbsPath;
  }

  _getRealPathFromNormalizedModuleID(moduleID) {
    return moduleID.split(path.delimiter)[1];
  }

  /**
   * Given a module name and the current file path, returns the normalized
   * (absolute) module path for said module. Relative-path CommonJS require()s
   * such as `require('./otherModule')` need to be looked up with context of
   * the module that's calling require()
   *
   * Also contains special case logic for built-in modules, in which it just
   * returns the module name.
   */
  _moduleNameToPath(currPath, moduleName) {
    // Relative-path CommonJS require()s such as `require('./otherModule')`
    // need to be looked up with context of the module that's calling
    // require().
    if (IS_PATH_BASED_MODULE_NAME.test(moduleName)) {
      // Normalize the relative path to an absolute path
      const modulePath = path.resolve(currPath, '..', moduleName);
      const extensions = this._config.moduleFileExtensions;

      // http://nodejs.org/docs/v0.10.0/api/all.html#all_all_together
      // LOAD_AS_FILE #1
      if (fs.existsSync(modulePath) && fs.statSync(modulePath).isFile()) {
        return modulePath;
      }
      // LOAD_AS_FILE #2+
      for (let i = 0; i < extensions.length; i++) {
        const fullPath = modulePath + '.' + extensions[i];
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
          return fullPath;
        }
      }
      // LOAD_AS_DIRECTORY
      if (fs.existsSync(modulePath) && fs.statSync(modulePath).isDirectory()) {
        // LOAD_AS_DIRECTORY #1
        const packagePath = path.join(modulePath, 'package.json');
        if (fs.existsSync(packagePath)) {
          const packageData = require(packagePath);
          if (packageData.main) {
            const mainPath = path.join(modulePath, packageData.main);
            if (fs.existsSync(mainPath)) {
              return mainPath;
            }
          }
        }

        // The required path is a valid directory, but there's no matching
        // js file at the same path. So look in the directory for an
        // index.js file.
        const indexPath = path.join(modulePath, 'index');
        for (let i = 0; i < extensions.length; i++) {
          const fullPath = indexPath + '.' + extensions[i];
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            return fullPath;
          }
        }
      }
    } else {
      const resource = this._getResource('JS', moduleName);
      if (!resource) {
        return this._nodeModuleNameToPath(currPath, moduleName);
      }
      return resource.path;
    }
  }

  _nodeModuleNameToPath(currPath, moduleName) {
    // Handle module names like require('jest/lib/util')
    let subModulePath = null;
    let moduleProjectPart = moduleName;
    if (/\//.test(moduleName)) {
      const projectPathParts = moduleName.split('/');
      moduleProjectPart = projectPathParts.shift();
      subModulePath = projectPathParts.join('/');
    }

    let resolveError = null;
    const exts = this._config.moduleFileExtensions.map(ext => '.' + ext);
    try {
      if (NODE_PATH) {
        return resolve.sync(moduleName, {
          paths: NODE_PATH.split(path.delimiter),
          basedir: path.dirname(currPath),
          extensions: exts,
        });
      } else {
        return resolve.sync(moduleName, {
          basedir: path.dirname(currPath),
          extensions: exts,
        });
      }
    } catch (e) {
      // Facebook has clowny package.json resolution rules that don't apply to
      // regular Node rules. Until we can make ModuleLoaders more pluggable
      // (so that FB can have a custom ModuleLoader and all the normal people
      // can have a normal ModuleLoader), we catch node-resolution exceptions
      // and fall back to some custom resolution logic before throwing the
      // error.
      resolveError = e;
    }

    // Memoize the project name -> package.json resource lookup map
    if (this._nodeModuleProjectConfigNameToResource === null) {
      this._nodeModuleProjectConfigNameToResource = {};
      const resources =
        this._resourceMap.getAllResourcesByType('ProjectConfiguration');
      resources.forEach(
        res => this._nodeModuleProjectConfigNameToResource[res.data.name] = res
      );
    }

    // Get the resource for the package.json file
    const resource =
      this._nodeModuleProjectConfigNameToResource[moduleProjectPart];
    if (!resource) {
      throw resolveError;
    }

    // Make sure the resource path is above the currPath in the fs path
    // tree. If so, just use node's resolve
    const resourceDirname = path.dirname(resource.path);
    const currFileDirname = path.dirname(currPath);
    if (resourceDirname.indexOf(currFileDirname) > 0) {
      throw resolveError;
    }

    if (subModulePath === null) {
      subModulePath = hasOwnProperty.call(resource.data, 'main')
        ? resource.data.main
        : 'index.js';
    }

    return this._moduleNameToPath(resource.path, './' + subModulePath);
  }

  /**
   * Indicates whether a given module is mocked per the current state of the
   * module loader. When a module is "mocked", that means calling
   * `requireModuleOrMock()` for the module will return the mock version
   * rather than the real version.
   */
  _shouldMock(currPath, moduleName) {
    const moduleID = this._getNormalizedModuleID(currPath, moduleName);
    if (hasOwnProperty.call(this._explicitShouldMock, moduleID)) {
      return this._explicitShouldMock[moduleID];
    } else if (NODE_CORE_MODULES[moduleName]) {
      return false;
    } else if (this._shouldAutoMock) {
      // See if the module is specified in the config as a module that should
      // never be mocked
      if (hasOwnProperty.call(this._configShouldMockModuleNames, moduleName)) {
        return this._configShouldMockModuleNames[moduleName];
      } else if (this._unmockListRegExps.length > 0) {
        this._configShouldMockModuleNames[moduleName] = true;

        const manualMockResource = this._getResource('JSMock', moduleName);
        let modulePath;
        try {
          modulePath = this._moduleNameToPath(currPath, moduleName);
        } catch (e) {
          // If there isn't a real module, we don't have a path to match
          // against the unmockList regexps. If there is also not a manual
          // mock, then we throw because this module doesn't exist anywhere.
          //
          // However, it's possible that someone has a manual mock for a
          // non-existent real module. In this case, we should mock the module
          // (because we technically can).
          //
          // Ideally this should never happen, but we have some odd
          // pre-existing edge-cases that rely on it so we need it for now.
          //
          // I'd like to eliminate this behavior in favor of requiring that
          // all module environments are complete (meaning you can't just
          // write a manual mock as a substitute for a real module).
          if (manualMockResource) {
            return true;
          }
          throw e;
        }
        let unmockRegExp;

        // Never mock the jasmine environment.
        if (modulePath.indexOf(VENDOR_PATH) === 0) {
          return false;
        }

        const realPath = fs.realpathSync(modulePath);
        this._configShouldMockModuleNames[moduleName] = true;
        for (let i = 0; i < this._unmockListRegExps.length; i++) {
          unmockRegExp = this._unmockListRegExps[i];
          if (unmockRegExp.test(modulePath) ||
              unmockRegExp.test(realPath)) {
            return this._configShouldMockModuleNames[moduleName] = false;
          }
        }
        return this._configShouldMockModuleNames[moduleName];
      }
      return true;
    } else {
      return false;
    }
  }

  constructBoundRequire(modulePath) {
    const boundModuleRequire = this.requireModuleOrMock.bind(this, modulePath);

    boundModuleRequire.resolve = moduleName => {
      const ret = this._moduleNameToPath(modulePath, moduleName);
      if (!ret) {
        throw new Error(`Module(${moduleName}) not found!`);
      }
      return ret;
    };
    boundModuleRequire.generateMock = this._generateMock.bind(this, modulePath);
    boundModuleRequire.requireMock = this.requireMock.bind(this, modulePath);
    boundModuleRequire.requireActual =
      this.requireModule.bind(this, modulePath);

    return boundModuleRequire;
  }

  /**
   * Returns a map from modulePath -> coverageInfo, where coverageInfo is of the
   * structure returned By CoverageCollector.extractRuntimeCoverageInfo()
   */
  getAllCoverageInfo() {
    if (!this._config.collectCoverage) {
      throw new Error(
        'config.collectCoverage was not set, so no coverage info has been ' +
        '(or will be) collected!'
      );
    }

    const coverageInfo = {};
    for (const filePath in this._coverageCollectors) {
      coverageInfo[filePath] =
        this._coverageCollectors[filePath].extractRuntimeCoverageInfo();
    }
    return coverageInfo;
  }

  getCoverageForFilePath(filePath) {
    if (!this._config.collectCoverage) {
      throw new Error(
        'config.collectCoverage was not set, so no coverage info has been ' +
        '(or will be) collected!'
      );
    }

    return (
      hasOwnProperty.call(this._coverageCollectors, filePath)
      ? this._coverageCollectors[filePath].extractRuntimeCoverageInfo()
      : null
    );
  }

  /**
   * Given the path to some file, find the path to all other files that it
   * *directly* depends on.
   */
  getDependenciesFromPath(modulePath) {
    const resource = this._resourceMap.getResourceByPath(modulePath);
    if (!resource) {
      throw new Error(`Unknown modulePath: ${modulePath}`);
    }

    if (resource.type === 'ProjectConfiguration'
        || resource.type === 'Resource') {
      throw new Error(
        `Could not extract dependency information from this type of file!`
      );
    }

    return this._getDependencyPathsFromResource(resource);
  }

  /**
   * Given the path to some module, find all other files that *directly* depend
   * on it.
   */
  getDependentsFromPath(modulePath) {
    if (this._reverseDependencyMap === null) {
      const resourceMap = this._resourceMap;
      const reverseDepMap = this._reverseDependencyMap = {};
      const allResources = resourceMap.getAllResources();
      Object.keys(allResources).forEach(resourceID => {
        const resource = allResources[resourceID];
        if (
          resource.type === 'ProjectConfiguration' ||
          resource.type === 'Resource'
        ) {
          return;
        }

        const dependencyPaths = this._getDependencyPathsFromResource(resource);
        for (let i = 0; i < dependencyPaths.length; i++) {
          const requiredModulePath = dependencyPaths[i];
          if (!hasOwnProperty.call(reverseDepMap, requiredModulePath)) {
            reverseDepMap[requiredModulePath] = {};
          }
          reverseDepMap[requiredModulePath][resource.path] = true;
        }
      });
    }

    const reverseDeps = this._reverseDependencyMap[modulePath];
    return reverseDeps ? Object.keys(reverseDeps) : [];
  }

  /**
   * Given a module name, return the mock version of said module.
   */
  requireMock(currPath, moduleName) {
    const moduleID = this._getNormalizedModuleID(currPath, moduleName);

    if (hasOwnProperty.call(this._explicitlySetMocks, moduleID)) {
      return this._explicitlySetMocks[moduleID];
    }

    // Look in the node-haste resource map
    let manualMockResource = this._getResource('JSMock', moduleName);
    let modulePath;
    if (manualMockResource) {
      modulePath = manualMockResource.path;
    } else {
      modulePath = this._moduleNameToPath(currPath, moduleName);

      // If the actual module file has a __mocks__ dir sitting immediately next
      // to it, look to see if there is a manual mock for this file in that dir.
      //
      // The reason why node-haste isn't good enough for this is because
      // node-haste only handles manual mocks for @providesModules well.
      // Otherwise it's not good enough to disambiguate something like the
      // following scenario:
      //
      // subDir1/MyModule.js
      // subDir1/__mocks__/MyModule.js
      // subDir2/MyModule.js
      // subDir2/__mocks__/MyModule.js
      //
      // Where some other module does a relative require into each of the
      // respective subDir{1,2} directories and expects a manual mock
      // corresponding to that particular MyModule.js file.
      const moduleDir = path.dirname(modulePath);
      const moduleFileName = path.basename(modulePath);
      const potentialManualMock =
        path.join(moduleDir, '__mocks__', moduleFileName);
      if (fs.existsSync(potentialManualMock)) {
        manualMockResource = true;
        modulePath = potentialManualMock;
      }
    }

    if (hasOwnProperty.call(this._mockRegistry, modulePath)) {
      return this._mockRegistry[modulePath];
    }

    if (manualMockResource) {
      const moduleObj = {
        exports: {},
        __filename: modulePath,
      };
      this._execModule(moduleObj);
      this._mockRegistry[modulePath] = moduleObj.exports;
    } else {
      // Look for a real module to generate an automock from
      this._mockRegistry[modulePath] = this._generateMock(
        currPath,
        moduleName
      );
    }

    return this._mockRegistry[modulePath];
  }

  /**
   * Given a module name, return the *real* (un-mocked) version of said
   * module.
   */
  requireModule(currPath, moduleName, bypassRegistryCache) {
    const moduleID = this._getNormalizedModuleID(currPath, moduleName);
    let modulePath;

    // I don't like this behavior as it makes the module system's mocking
    // rules harder to understand. Would much prefer that mock state were
    // either "on" or "off" -- rather than "automock on", "automock off",
    // "automock off -- but there's a manual mock, so you get that if you ask
    // for the module and one doesnt exist", or "automock off -- but theres a
    // useAutoMock: false entry in the package.json -- and theres a manual
    // mock -- and the module is listed in the unMockList in the test config
    // -- soooo...uhh...fuck I lost track".
    //
    // To simplify things I'd like to move to a system where tests must
    // explicitly call .mock() on a module to receive the mocked version if
    // automocking is off. If a manual mock exists, that is used. Otherwise
    // we fall back to the automocking system to generate one for you.
    //
    // The only reason we're supporting this in jest for now is because we
    // have some tests that depend on this behavior. I'd like to clean this
    // up at some point in the future.
    let manualMockResource = null;
    let moduleResource = null;
    moduleResource = this._getResource('JS', moduleName);
    manualMockResource = this._getResource('JSMock', moduleName);
    if (
      !moduleResource &&
      manualMockResource &&
      manualMockResource.path !== this._isCurrentlyExecutingManualMock &&
      this._explicitShouldMock[moduleID] !== false
    ) {
      modulePath = manualMockResource.path;
    }

    if (NODE_CORE_MODULES[moduleName]) {
      return require(moduleName);
    }

    if (!modulePath) {
      modulePath = this._moduleNameToPath(currPath, moduleName);
    }

    // Always natively require the jasmine runner.
    if (modulePath.indexOf(VENDOR_PATH) === 0) {
      return require(modulePath);
    }

    if (!modulePath) {
      throw new Error(`Cannot find module '${moduleName}' from '${currPath}'`);
    }

    let moduleObj;
    if (!bypassRegistryCache) {
      moduleObj = this._moduleRegistry[modulePath];
    }
    if (!moduleObj) {
      // We must register the pre-allocated module object first so that any
      // circular dependencies that may arise while evaluating the module can
      // be satisfied.
      moduleObj = {
        __filename: modulePath,
        exports: {},
      };

      if (!bypassRegistryCache) {
        this._moduleRegistry[modulePath] = moduleObj;
      }

      if (path.extname(modulePath) === '.json') {
        moduleObj.exports = this._environment.global.JSON.parse(
          fs.readFileSync(modulePath, 'utf8')
        );
      } else if (path.extname(modulePath) === '.node') {
        moduleObj.exports = require(modulePath);
      } else {
        this._execModule(moduleObj);
      }
    }

    return moduleObj.exports;
  }

  /**
   * If the moduleNameMapper config is set, go through all the mappings
   * and resolve the module name.
   */
  _resolveStubModuleName(moduleName) {
    const nameMapper = this._mappedModuleNames;
    for (const mappedModuleName in nameMapper) {
      const regex = nameMapper[mappedModuleName];
      if (regex.test(moduleName)) {
        return mappedModuleName;
      }
    }
  }

  /**
   * Given a module name, return either the real module or the mock version of
   * that module -- depending on the mocking state of the loader (and, perhaps
   * the mocking state for the requested module).
   */
  requireModuleOrMock(currPath, moduleName) {
    if (this._shouldMock(currPath, moduleName)) {
      return this.requireMock(currPath, moduleName);
    } else {
      return this.requireModule(currPath, moduleName);
    }
  }

  getJestRuntime(dir) {
    return this._createRuntimeFor(dir);
  }

  _createRuntimeFor(currPath) {
    const runtime = {
      addMatchers: matchers => {
        const jasmine = this._environment.global.jasmine;
        jasmine.getEnv().currentSpec.addMatchers(matchers);
      },

      autoMockOff: () => {
        this._shouldAutoMock = false;
        return runtime;
      },

      autoMockOn: () => {
        this._shouldAutoMock = true;
        return runtime;
      },

      clearAllTimers: () => this._environment.fakeTimers.clearAllTimers(),
      currentTestPath: () => this._environment.testFilePath,

      dontMock: moduleName => {
        const moduleID = this._getNormalizedModuleID(currPath, moduleName);
        this._explicitShouldMock[moduleID] = false;
        return runtime;
      },

      getTestEnvData: () => {
        const frozenCopy = {};
        // Make a shallow copy only because a deep copy seems like
        // overkill..
        Object.keys(this._config.testEnvData).forEach(
          key => frozenCopy[key] = this._config.testEnvData[key]
        );
        Object.freeze(frozenCopy);
        return frozenCopy;
      },

      genMockFromModule: moduleName => this._generateMock(
        this._currentlyExecutingModulePath,
        moduleName
      ),

      genMockFunction: moduleMocker.getMockFunction,
      genMockFn: moduleMocker.getMockFunction,

      mock: moduleName => {
        const moduleID = this._getNormalizedModuleID(currPath, moduleName);
        this._explicitShouldMock[moduleID] = true;
        return runtime;
      },

      resetModuleRegistry: () => {
        var envGlobal = this._environment.global;
        Object.keys(envGlobal).forEach(key => {
          const globalMock = envGlobal[key];
          if (
            (typeof globalMock === 'object' && globalMock !== null) ||
            typeof globalMock === 'function'
          ) {
            globalMock._isMockFunction && globalMock.mockClear();
          }
        });

        if (envGlobal.mockClearTimers) {
          envGlobal.mockClearTimers();
        }

        this.resetModuleRegistry();

        return runtime;
      },

      runAllTicks: () => this._environment.fakeTimers.runAllTicks(),
      runAllImmediates: () => this._environment.fakeTimers.runAllImmediates(),
      runAllTimers: () => this._environment.fakeTimers.runAllTimers(),
      runOnlyPendingTimers: () =>
        this._environment.fakeTimers.runOnlyPendingTimers(),

      setMock: (moduleName, moduleExports) => {
        const moduleID = this._getNormalizedModuleID(currPath, moduleName);
        this._explicitShouldMock[moduleID] = true;
        this._explicitlySetMocks[moduleID] = moduleExports;
        return runtime;
      },

      useFakeTimers: () => this._environment.fakeTimers.useFakeTimers(),
      useRealTimers: () => this._environment.fakeTimers.useRealTimers(),
    };
    return runtime;
  }

  resetModuleRegistry() {
    this._mockRegistry = {};
    this._moduleRegistry = {};
  }
}

module.exports = Loader;
