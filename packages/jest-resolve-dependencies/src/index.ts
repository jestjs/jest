/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import type {IHasteFS} from 'jest-haste-map';
import type {ResolveModuleConfig, default as Resolver} from 'jest-resolve';
import {type SnapshotResolver, isSnapshotPath} from 'jest-snapshot';

export type ResolvedModule = {
  file: string;
  dependencies: Array<string>;
};

/**
 * DependencyResolver is used to resolve the direct dependencies of a module or
 * to retrieve a list of all transitive inverse dependencies.
 */
export class DependencyResolver {
  private readonly _hasteFS: IHasteFS;
  private readonly _resolver: Resolver;
  private readonly _snapshotResolver: SnapshotResolver;

  constructor(
    resolver: Resolver,
    hasteFS: IHasteFS,
    snapshotResolver: SnapshotResolver,
  ) {
    this._resolver = resolver;
    this._hasteFS = hasteFS;
    this._snapshotResolver = snapshotResolver;
  }

  resolve(file: string, options?: ResolveModuleConfig): Array<string> {
    const dependencies = this._hasteFS.getDependencies(file);
    if (!dependencies) {
      return [];
    }

    return dependencies.reduce<Array<string>>((acc, dependency) => {
      if (this._resolver.isCoreModule(dependency)) {
        return acc;
      }

      let resolvedDependency;
      let resolvedMockDependency;
      try {
        resolvedDependency = this._resolver.resolveModule(
          file,
          dependency,
          options,
        );
      } catch {
        try {
          resolvedDependency = this._resolver.getMockModule(file, dependency);
        } catch {
          // leave resolvedDependency as undefined if nothing can be found
        }
      }

      if (resolvedDependency == null) {
        return acc;
      }

      acc.push(resolvedDependency);

      // If we resolve a dependency, then look for a mock dependency
      // of the same name in that dependency's directory.
      try {
        resolvedMockDependency = this._resolver.getMockModule(
          resolvedDependency,
          path.basename(dependency),
        );
      } catch {
        // leave resolvedMockDependency as undefined if nothing can be found
      }

      if (resolvedMockDependency != null) {
        const dependencyMockDir = path.resolve(
          path.dirname(resolvedDependency),
          '__mocks__',
        );

        resolvedMockDependency = path.resolve(resolvedMockDependency);

        // make sure mock is in the correct directory
        if (dependencyMockDir === path.dirname(resolvedMockDependency)) {
          acc.push(resolvedMockDependency);
        }
      }

      return acc;
    }, []);
  }

  resolveInverseModuleMap(
    paths: Set<string>,
    filter: (file: string) => boolean,
    options?: ResolveModuleConfig,
  ): Array<ResolvedModule> {
    if (paths.size === 0) {
      return [];
    }

    const collectModules = (
      related: Set<string>,
      moduleMap: Array<ResolvedModule>,
      changed: Set<string>,
    ) => {
      const visitedModules = new Set();
      const result: Array<ResolvedModule> = [];
      while (changed.size > 0) {
        changed = new Set(
          moduleMap.reduce<Array<string>>((acc, module) => {
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
            acc.push(file);
            return acc;
          }, []),
        );
      }
      return [
        ...result,
        ...[...related].map(file => ({dependencies: [], file})),
      ];
    };

    const relatedPaths = new Set<string>();
    const changed = new Set<string>();
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
    const modules: Array<ResolvedModule> = [];
    for (const file of this._hasteFS.getAbsoluteFileIterator()) {
      modules.push({
        dependencies: this.resolve(file, options),
        file,
      });
    }
    return collectModules(relatedPaths, modules, changed);
  }

  resolveInverse(
    paths: Set<string>,
    filter: (file: string) => boolean,
    options?: ResolveModuleConfig,
  ): Array<string> {
    return this.resolveInverseModuleMap(paths, filter, options).map(
      module => module.file,
    );
  }
}
