/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Config, Resolve, Snapshot} from '@jest/types';
import {FS as HasteFS} from 'jest-haste-map';
import Resolver from 'jest-resolve';
import {isSnapshotPath} from 'jest-snapshot';

/**
 * DependencyResolver is used to resolve the direct dependencies of a module or
 * to retrieve a list of all transitive inverse dependencies.
 */
class DependencyResolver {
  _hasteFS: HasteFS;
  _resolver: Resolver;
  _snapshotResolver: Snapshot.SnapshotResolver;

  constructor(
    resolver: Resolver,
    hasteFS: HasteFS,
    snapshotResolver: Snapshot.SnapshotResolver,
  ) {
    this._resolver = resolver;
    this._hasteFS = hasteFS;
    this._snapshotResolver = snapshotResolver;
  }

  resolve(
    file: Config.Path,
    options?: Resolve.ResolveModuleConfig,
  ): Array<Config.Path> {
    const dependencies = this._hasteFS.getDependencies(file);
    if (!dependencies) {
      return [];
    }

    return dependencies.reduce<Array<Config.Path>>((acc, dependency) => {
      if (this._resolver.isCoreModule(dependency)) {
        return acc;
      }
      let resolvedDependency;
      try {
        resolvedDependency = this._resolver.resolveModule(
          file,
          dependency,
          options,
        );
      } catch (e) {
        resolvedDependency = this._resolver.getMockModule(file, dependency);
      }

      if (resolvedDependency) {
        acc.push(resolvedDependency);
      }

      return acc;
    }, []);
  }

  resolveInverseModuleMap(
    paths: Set<Config.Path>,
    filter: (file: Config.Path) => boolean,
    options?: Resolve.ResolveModuleConfig,
  ): Array<Resolve.ResolvedModule> {
    if (!paths.size) {
      return [];
    }

    const collectModules = (
      related: Set<Config.Path>,
      moduleMap: Array<Resolve.ResolvedModule>,
      changed: Set<Config.Path>,
    ) => {
      const visitedModules = new Set();
      const result: Array<Resolve.ResolvedModule> = [];
      while (changed.size) {
        changed = new Set(
          moduleMap.reduce<Array<Config.Path>>((acc, module) => {
            if (
              visitedModules.has(module.file) ||
              !module.dependencies.some(dep => changed.has(dep))
            ) {
              return acc;
            }

            const file = module.file;
            if (filter(file)) {
              result.push(module);
              related.delete(file);
            }
            visitedModules.add(file);
            acc.push(module.file);
            return acc;
          }, []),
        );
      }
      return result.concat(
        Array.from(related).map(file => ({dependencies: [], file})),
      );
    };

    const relatedPaths = new Set<Config.Path>();
    const changed: Set<Config.Path> = new Set();
    for (const path of paths) {
      if (this._hasteFS.exists(path)) {
        const modulePath = isSnapshotPath(path)
          ? this._snapshotResolver.resolveTestPath(path)
          : path;
        changed.add(modulePath);
        if (filter(modulePath)) {
          relatedPaths.add(modulePath);
        }
      }
    }
    const modules: Array<Resolve.ResolvedModule> = [];
    for (const file of this._hasteFS.getAbsoluteFileIterator()) {
      modules.push({
        dependencies: this.resolve(file, options),
        file,
      });
    }
    return collectModules(relatedPaths, modules, changed);
  }

  resolveInverse(
    paths: Set<Config.Path>,
    filter: (file: Config.Path) => boolean,
    options?: Resolve.ResolveModuleConfig,
  ): Array<Config.Path> {
    return this.resolveInverseModuleMap(paths, filter, options).map(
      module => module.file,
    );
  }
}

export = DependencyResolver;
