/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import type {JestWorkerFarm} from 'jest-worker';
import H from '../constants';
import getMockName from '../getMockName';
import type {
  FileData,
  InternalHasteMap,
  MockData,
  ModuleMapData,
  ModuleMapItem,
  ModuleMetaData,
  WorkerMetadata,
} from '../types';
import type {WorkerPool} from './WorkerPool';
import * as fastPath from './fast_path';
import getPlatformExtension from './getPlatformExtension';

const NODE_MODULES = `${path.sep}node_modules${path.sep}`;
const PACKAGE_JSON = `${path.sep}package.json`;

type HasteWorker = typeof import('../worker');
type WorkerOptions = {forceInBand: boolean};

type FileProcessorOptions = {
  computeDependencies: boolean;
  computeSha1: boolean;
  dependencyExtractor: string | null;
  hasteImplModulePath?: string;
  mocksPattern: RegExp | null;
  platforms: Array<string>;
  retainAllFiles: boolean;
  rootDir: string;
  skipPackageJson: boolean;
  throwOnModuleCollision: boolean;
};

export class DuplicateError extends Error {
  mockPath1: string;
  mockPath2: string;

  constructor(mockPath1: string, mockPath2: string) {
    super('Duplicated files or mocks. Please check the console for more info');

    this.mockPath1 = mockPath1;
    this.mockPath2 = mockPath2;
  }
}

export class FileProcessor {
  private readonly _console: Console;
  private readonly _options: FileProcessorOptions;
  private readonly _workerPool: WorkerPool;

  constructor(
    options: FileProcessorOptions,
    console: Console,
    workerPool: WorkerPool,
  ) {
    this._console = console;
    this._options = options;
    this._workerPool = workerPool;
  }

  processFile(
    hasteMap: InternalHasteMap,
    map: ModuleMapData,
    mocks: MockData,
    filePath: string,
    workerOptions?: WorkerOptions,
  ): Promise<void> | null {
    const rootDir = this._options.rootDir;

    const setModule = (id: string, module: ModuleMetaData) => {
      let moduleMap = map.get(id);
      if (!moduleMap) {
        moduleMap = Object.create(null) as ModuleMapItem;
        map.set(id, moduleMap);
      }
      const platform =
        getPlatformExtension(module[H.PATH], this._options.platforms) ||
        H.GENERIC_PLATFORM;

      const existingModule = moduleMap[platform];

      if (existingModule && existingModule[H.PATH] !== module[H.PATH]) {
        const method = this._options.throwOnModuleCollision ? 'error' : 'warn';

        this._console[method](
          [
            `jest-haste-map: Haste module naming collision: ${id}`,
            '  The following files share their name; please adjust your hasteImpl:',
            `    * <rootDir>${path.sep}${existingModule[H.PATH]}`,
            `    * <rootDir>${path.sep}${module[H.PATH]}`,
            '',
          ].join('\n'),
        );

        if (this._options.throwOnModuleCollision) {
          throw new DuplicateError(existingModule[H.PATH], module[H.PATH]);
        }

        // We do NOT want consumers to use a module that is ambiguous.
        delete moduleMap[platform];

        if (Object.keys(moduleMap).length === 0) {
          map.delete(id);
        }

        let dupsByPlatform = hasteMap.duplicates.get(id);
        if (dupsByPlatform == null) {
          dupsByPlatform = new Map();
          hasteMap.duplicates.set(id, dupsByPlatform);
        }

        const dups = new Map([
          [module[H.PATH], module[H.TYPE]],
          [existingModule[H.PATH], existingModule[H.TYPE]],
        ]);
        dupsByPlatform.set(platform, dups);

        return;
      }

      const dupsByPlatform = hasteMap.duplicates.get(id);
      if (dupsByPlatform != null) {
        const dups = dupsByPlatform.get(platform);
        if (dups != null) {
          dups.set(module[H.PATH], module[H.TYPE]);
        }
        return;
      }

      moduleMap[platform] = module;
    };

    const relativeFilePath = fastPath.relative(rootDir, filePath);
    const fileMetadata = hasteMap.files.get(relativeFilePath);
    if (!fileMetadata) {
      throw new Error(
        'jest-haste-map: File to process was not found in the haste map.',
      );
    }

    const moduleMetadata = hasteMap.map.get(fileMetadata[H.ID]);
    const computeSha1 = this._options.computeSha1 && !fileMetadata[H.SHA1];

    const workerReply = (metadata: WorkerMetadata) => {
      // `1` for truthy values instead of `true` to save cache space.
      fileMetadata[H.VISITED] = 1;

      const metadataId = metadata.id;
      const metadataModule = metadata.module;

      if (metadataId && metadataModule) {
        fileMetadata[H.ID] = metadataId;
        setModule(metadataId, metadataModule);
      }

      fileMetadata[H.DEPENDENCIES] = metadata.dependencies
        ? metadata.dependencies.join(H.DEPENDENCY_DELIM)
        : '';

      if (computeSha1) {
        fileMetadata[H.SHA1] = metadata.sha1;
      }
    };

    const workerError = (error: Error | any) => {
      if (typeof error !== 'object' || !error.message || !error.stack) {
        error = new Error(error);
        error.stack = ''; // Remove stack for stack-less errors.
      }

      if (!['ENOENT', 'EACCES'].includes(error.code)) {
        throw error;
      }

      // If a file cannot be read we remove it from the file list and
      // ignore the failure silently.
      hasteMap.files.delete(relativeFilePath);
    };

    // If we retain all files in the virtual HasteFS representation, we avoid
    // reading them if they aren't important (node_modules).
    if (this._options.retainAllFiles && filePath.includes(NODE_MODULES)) {
      if (computeSha1) {
        return this._getWorker(workerOptions)
          .getSha1({
            computeDependencies: this._options.computeDependencies,
            computeSha1,
            dependencyExtractor: this._options.dependencyExtractor,
            filePath,
            hasteImplModulePath: this._options.hasteImplModulePath,
            rootDir,
          })
          .then(workerReply, workerError);
      }

      return null;
    }

    if (
      this._options.mocksPattern &&
      this._options.mocksPattern.test(filePath)
    ) {
      const mockPath = getMockName(filePath);
      const existingMockPath = mocks.get(mockPath);

      if (existingMockPath) {
        const secondMockPath = fastPath.relative(rootDir, filePath);
        if (existingMockPath !== secondMockPath) {
          const method = this._options.throwOnModuleCollision
            ? 'error'
            : 'warn';

          this._console[method](
            [
              `jest-haste-map: duplicate manual mock found: ${mockPath}`,
              '  The following files share their name; please delete one of them:',
              `    * <rootDir>${path.sep}${existingMockPath}`,
              `    * <rootDir>${path.sep}${secondMockPath}`,
              '',
            ].join('\n'),
          );

          if (this._options.throwOnModuleCollision) {
            throw new DuplicateError(existingMockPath, secondMockPath);
          }
        }
      }

      mocks.set(mockPath, relativeFilePath);
    }

    if (fileMetadata[H.VISITED]) {
      if (!fileMetadata[H.ID]) {
        return null;
      }

      if (moduleMetadata != null) {
        const platform =
          getPlatformExtension(filePath, this._options.platforms) ||
          H.GENERIC_PLATFORM;

        const module = moduleMetadata[platform];

        if (module == null) {
          return null;
        }

        const moduleId = fileMetadata[H.ID];
        let modulesByPlatform = map.get(moduleId);
        if (!modulesByPlatform) {
          modulesByPlatform = Object.create(null) as ModuleMapItem;
          map.set(moduleId, modulesByPlatform);
        }
        modulesByPlatform[platform] = module;

        return null;
      }
    }

    return this._getWorker(workerOptions)
      .worker({
        computeDependencies: this._options.computeDependencies,
        computeSha1,
        dependencyExtractor: this._options.dependencyExtractor,
        filePath,
        hasteImplModulePath: this._options.hasteImplModulePath,
        rootDir,
      })
      .then(workerReply, workerError);
  }

  buildHasteMap(
    data: {
      removedFiles: FileData;
      changedFiles?: FileData;
      hasteMap: InternalHasteMap;
    },
    recoverDuplicates: (
      hasteMap: InternalHasteMap,
      relativeFilePath: string,
      moduleName: string,
    ) => void,
  ): Promise<InternalHasteMap> {
    const {removedFiles, changedFiles, hasteMap} = data;

    // If any files were removed or we did not track what files changed, process
    // every file looking for changes. Otherwise, process only changed files.
    let map: ModuleMapData;
    let mocks: MockData;
    let filesToProcess: FileData;
    if (changedFiles === undefined || removedFiles.size > 0) {
      map = new Map();
      mocks = new Map();
      filesToProcess = hasteMap.files;
    } else {
      map = hasteMap.map;
      mocks = hasteMap.mocks;
      filesToProcess = changedFiles;
    }

    for (const [relativeFilePath, fileMetadata] of removedFiles) {
      recoverDuplicates(hasteMap, relativeFilePath, fileMetadata[H.ID]);
    }

    const promises: Array<Promise<void>> = [];
    for (const relativeFilePath of filesToProcess.keys()) {
      if (
        this._options.skipPackageJson &&
        relativeFilePath.endsWith(PACKAGE_JSON)
      ) {
        continue;
      }
      // SHA-1, if requested, should already be present thanks to the crawler.
      const filePath = fastPath.resolve(
        this._options.rootDir,
        relativeFilePath,
      );
      const promise = this.processFile(hasteMap, map, mocks, filePath);
      if (promise) {
        promises.push(promise);
      }
    }

    return Promise.all(promises).then(
      () => {
        this._workerPool.end();
        hasteMap.map = map;
        hasteMap.mocks = mocks;
        return hasteMap;
      },
      error => {
        this._workerPool.end();
        throw error;
      },
    );
  }

  private _getWorker(
    options: WorkerOptions | undefined,
  ): JestWorkerFarm<HasteWorker> | HasteWorker {
    return this._workerPool.get(options?.forceInBand);
  }
}
