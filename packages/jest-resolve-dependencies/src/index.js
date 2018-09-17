/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HasteFS} from 'types/HasteMap';
import type {Path} from 'types/Config';
import type {Resolver, ResolveModuleConfig} from 'types/Resolve';
import Snapshot from 'jest-snapshot';

import {replacePathSepForRegex} from 'jest-regex-util';

const snapshotDirRegex = new RegExp(replacePathSepForRegex('/__snapshots__/'));
const snapshotFileRegex = new RegExp(
  replacePathSepForRegex(`__snapshots__/(.*).${Snapshot.EXTENSION}`),
);
const isSnapshotPath = (path: string): boolean =>
  !!path.match(snapshotDirRegex);

/**
 * DependencyResolver is used to resolve the direct dependencies of a module or
 * to retrieve a list of all transitive inverse dependencies.
 */
class DependencyResolver {
  _hasteFS: HasteFS;
  _resolver: Resolver;

  constructor(resolver: Resolver, hasteFS: HasteFS) {
    this._resolver = resolver;
    this._hasteFS = hasteFS;
  }

  resolve(file: Path, options?: ResolveModuleConfig): Array<Path> {
    const dependencies = this._hasteFS.getDependencies(file);
    if (!dependencies) {
      return [];
    }

    return dependencies
      .map(dependency => {
        if (this._resolver.isCoreModule(dependency)) {
          return null;
        }
        try {
          return this._resolver.resolveModule(file, dependency, options);
        } catch (e) {}
        return this._resolver.getMockModule(file, dependency);
      })
      .filter(Boolean);
  }

  resolveInverse(
    paths: Set<Path>,
    filter: (file: Path) => boolean,
    options?: ResolveModuleConfig,
  ): Array<Path> {
    if (!paths.size) {
      return [];
    }

    const collectModules = (relatedPaths, moduleMap, changed) => {
      const visitedModules = new Set();
      while (changed.size) {
        changed = new Set(
          moduleMap
            .filter(
              module =>
                !visitedModules.has(module.file) &&
                module.dependencies.some(dep => dep && changed.has(dep)),
            )
            .map(module => {
              const file = module.file;
              if (filter(file)) {
                relatedPaths.add(file);
              }
              visitedModules.add(file);
              return module.file;
            }),
        );
      }
      return relatedPaths;
    };

    const relatedPaths = new Set();
    const changed = new Set();
    for (const path of paths) {
      if (this._hasteFS.exists(path)) {
        // /path/to/__snapshots__/test.js.snap is always adjacent to
        // /path/to/test.js
        const modulePath = isSnapshotPath(path)
          ? path.replace(snapshotFileRegex, '$1')
          : path;
        changed.add(modulePath);
        if (filter(modulePath)) {
          relatedPaths.add(modulePath);
        }
      }
    }
    const modules = this._hasteFS.getAllFiles().map(file => ({
      dependencies: this.resolve(file, options),
      file,
    }));
    return Array.from(collectModules(relatedPaths, modules, changed));
  }
}

module.exports = DependencyResolver;
