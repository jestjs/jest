/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* eslint-disable fb-www/object-create-only-one-param */

'use strict';

const DependencyGraph = require('node-haste/lib/DependencyGraph');
const extractRequires = require('node-haste/lib/lib/extractRequires');

const REQUIRE_EXTENSIONS_PATTERN = /(\brequire\s*?\.\s*?(?:requireActual|requireMock)\s*?\(\s*?)(['"])([^'"]+)(\2\s*?\))/g;

const resolvers = Object.create(null);

class HasteResolver {

  constructor(roots, options) {
    const ignoreFilePattern = new RegExp(options.ignoreFilePattern);
    this._resolvePromises = Object.create(null);
    this._depGraph = new DependencyGraph({
      roots,
      ignoreFilePath: path => path.match(ignoreFilePattern),
      cache: {
        get: (a, b, cb) => Promise.resolve(cb()),
        invalidate: () => {},
      },
      fileWatcher: {
        on: function() {
          return this;
        },
        isWatchman: () => Promise.resolve(false),
      },
      extensions: options.extensions,
      mocksPattern: new RegExp(options.mocksPattern),
      extractRequires: code => {
        const data = extractRequires(code);
        data.code = data.code.replace(
          REQUIRE_EXTENSIONS_PATTERN,
          (match, pre, quot, dep, post) => {
            data.deps.sync.push(dep);
            return match;
          }
        );
        return data;
      },
    });

    // warm-up
    this._depGraph.load();
  }

  matchFilesByPattern(pattern) {
    return this._depGraph.matchFilesByPattern(pattern);
  }

  getDependencies(path) {
    if (this._resolvePromises[path]) {
      return this._resolvePromises[path];
    }

    return this._resolvePromises[path] = this._depGraph.load().then(
      () => this._depGraph.getDependencies(path).then(response =>
        response.finalize().then(() => {
          var deps = {
            mocks: response.mocks,
            resolvedModules: Object.create(null),
            resources: Object.create(null),
          };
          return Promise.all(
            response.dependencies.map(module => {
              if (!deps.resolvedModules[module.path]) {
                deps.resolvedModules[module.path] = Object.create(null);
              }
              response.getResolvedDependencyPairs(module).forEach((pair) =>
                deps.resolvedModules[module.path][pair[0]] = pair[1]
              );
              return module.getName().then(
                name => deps.resources[name] = module
              );
            })
          ).then(() => deps);
        })
      ));
  }

  static get(roots, options) {
    const key =
      roots.sort().join(':') +
      '$' + options.extensions.sort().join(':') +
      '$' + options.ignoreFilePattern +
      '$' + options.mocksPattern;
    if (!resolvers[key]) {
      resolvers[key] = new HasteResolver(roots, options);
    }

    return resolvers[key];
  }

}

module.exports = HasteResolver;
