/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {createTranspilingRequire} from '@jest/transform';
import {makeProjectConfig} from '@jest/test-utils';
import {requireOrImportModule} from 'jest-util';
import {
  type SnapshotResolver,
  buildSnapshotResolver,
} from '../SnapshotResolver';

jest.mock('@jest/transform', () => {
  const actual =
    jest.requireActual<typeof import('@jest/transform')>('@jest/transform');

  return {
    ...actual,
    createTranspilingRequire: jest.fn(actual.createTranspilingRequire),
  };
});

jest.mock('jest-util', () => {
  const actual = jest.requireActual<typeof import('jest-util')>('jest-util');

  return {
    ...actual,
    requireOrImportModule: jest.fn(actual.requireOrImportModule),
  };
});

type TranspilingRequire = Awaited<ReturnType<typeof createTranspilingRequire>>;

describe('defaults', () => {
  let snapshotResolver: SnapshotResolver;
  const projectConfig = makeProjectConfig({
    rootDir: 'default',
    // snapshotResolver: null,
  });

  beforeEach(async () => {
    snapshotResolver = await buildSnapshotResolver(projectConfig);
  });

  it('returns cached object if called multiple times', async () => {
    await expect(buildSnapshotResolver(projectConfig)).resolves.toBe(
      snapshotResolver,
    );
  });

  it('resolveSnapshotPath()', () => {
    expect(snapshotResolver.resolveSnapshotPath('/abc/cde/a.test.js')).toBe(
      path.join('/abc', 'cde', '__snapshots__', 'a.test.js.snap'),
    );
  });

  it('resolveTestPath()', () => {
    expect(
      snapshotResolver.resolveTestPath('/abc/cde/__snapshots__/a.test.js.snap'),
    ).toBe(path.resolve('/abc/cde/a.test.js'));
  });
});

describe('custom resolver in project config', () => {
  let snapshotResolver: SnapshotResolver;
  const customSnapshotResolverFile = path.join(
    __dirname,
    'fixtures',
    'customSnapshotResolver.js',
  );
  const projectConfig = makeProjectConfig({
    rootDir: 'custom1',
    snapshotResolver: customSnapshotResolverFile,
  });

  beforeEach(async () => {
    snapshotResolver = await buildSnapshotResolver(projectConfig);
  });

  it('returns cached object if called multiple times', async () => {
    await expect(buildSnapshotResolver(projectConfig)).resolves.toBe(
      snapshotResolver,
    );
  });

  it('resolveSnapshotPath()', () => {
    expect(
      snapshotResolver.resolveSnapshotPath(
        path.resolve('/abc/cde/__tests__/a.test.js'),
      ),
    ).toBe(path.resolve('/abc/cde/__snapshots__/a.test.js.snap'));
  });

  it('resolveTestPath()', () => {
    expect(
      snapshotResolver.resolveTestPath(
        path.resolve('/abc', 'cde', '__snapshots__', 'a.test.js.snap'),
      ),
    ).toBe(path.resolve('/abc/cde/__tests__/a.test.js'));
  });
});

describe('ESM-aware custom resolver loading', () => {
  afterEach(() => {
    jest
      .mocked(createTranspilingRequire)
      .mockImplementation(
        jest.requireActual<typeof import('@jest/transform')>('@jest/transform')
          .createTranspilingRequire,
      );
    jest
      .mocked(requireOrImportModule)
      .mockImplementation(
        jest.requireActual<typeof import('jest-util')>('jest-util')
          .requireOrImportModule,
      );
    jest.clearAllMocks();
  });

  it('loads .mjs snapshot resolver files through requireOrImportModule', async () => {
    const customSnapshotResolverFile = path.join(
      __dirname,
      'fixtures',
      'customSnapshotResolver.mjs',
    );
    const projectConfig = makeProjectConfig({
      rootDir: 'custom-esm-mocked',
      snapshotResolver: customSnapshotResolverFile,
    });
    const transpilingRequire = jest.fn();
    jest
      .mocked(createTranspilingRequire)
      .mockResolvedValue(transpilingRequire as unknown as TranspilingRequire);
    const requireOrImportModuleMock = jest
      .mocked(requireOrImportModule)
      .mockResolvedValue({
        resolveSnapshotPath: (testPath: string, snapshotExtension: string) =>
          testPath.replace('__tests__', '__snapshots__') + snapshotExtension,
        resolveTestPath: (
          snapshotFilePath: string,
          snapshotExtension: string,
        ) =>
          snapshotFilePath
            .replace('__snapshots__', '__tests__')
            .slice(0, -snapshotExtension.length),
        testPathForConsistencyCheck: 'foo/__tests__/bar.test.js',
      });

    const snapshotResolver = await buildSnapshotResolver(projectConfig);

    expect(createTranspilingRequire).toHaveBeenCalledWith(projectConfig);
    expect(requireOrImportModuleMock).toHaveBeenCalledWith(
      customSnapshotResolverFile,
    );
    expect(transpilingRequire).not.toHaveBeenCalled();
    expect(
      snapshotResolver.resolveSnapshotPath(
        path.resolve('/abc/cde/__tests__/a.test.js'),
      ),
    ).toBe(path.resolve('/abc/cde/__snapshots__/a.test.js.snap'));
  });

  it('continues to load .js snapshot resolver files through transpiling require', async () => {
    const customSnapshotResolverFile = path.join(
      __dirname,
      'fixtures',
      'customSnapshotResolver.js',
    );
    const projectConfig = makeProjectConfig({
      rootDir: 'custom-js-transpiling-require',
      snapshotResolver: customSnapshotResolverFile,
    });
    const transpilingRequire = jest.fn(async (_modulePath: string) => ({
      resolveSnapshotPath: (testPath: string, snapshotExtension: string) =>
        testPath.replace('__tests__', '__snapshots__') + snapshotExtension,
      resolveTestPath: (snapshotFilePath: string, snapshotExtension: string) =>
        snapshotFilePath
          .replace('__snapshots__', '__tests__')
          .slice(0, -snapshotExtension.length),
      testPathForConsistencyCheck: 'foo/__tests__/bar.test.js',
    }));
    jest
      .mocked(createTranspilingRequire)
      .mockResolvedValue(transpilingRequire as unknown as TranspilingRequire);

    const snapshotResolver = await buildSnapshotResolver(projectConfig);

    expect(createTranspilingRequire).toHaveBeenCalledWith(projectConfig);
    expect(transpilingRequire).toHaveBeenCalledWith(customSnapshotResolverFile);
    expect(requireOrImportModule).not.toHaveBeenCalled();
    expect(
      snapshotResolver.resolveSnapshotPath(
        path.resolve('/abc/cde/__tests__/a.test.js'),
      ),
    ).toBe(path.resolve('/abc/cde/__snapshots__/a.test.js.snap'));
  });
});

describe('malformed custom resolver in project config', () => {
  const newProjectConfig = (filename: string) => {
    const customSnapshotResolverFile = path.join(
      __dirname,
      'fixtures',
      filename,
    );
    return makeProjectConfig({
      rootDir: 'missing-resolveSnapshotPath',
      snapshotResolver: customSnapshotResolverFile,
    });
  };

  it('missing resolveSnapshotPath throws ', async () => {
    const projectConfig = newProjectConfig(
      'customSnapshotResolver-missing-resolveSnapshotPath.js',
    );
    await expect(
      buildSnapshotResolver(projectConfig),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('missing resolveTestPath throws ', async () => {
    const projectConfig = newProjectConfig(
      'customSnapshotResolver-missing-resolveTestPath.js',
    );
    await expect(
      buildSnapshotResolver(projectConfig),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('missing testPathForConsistencyCheck throws ', async () => {
    const projectConfig = newProjectConfig(
      'customSnapshotResolver-missing-test-path-for-consistency-check.js',
    );
    await expect(
      buildSnapshotResolver(projectConfig),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('inconsistent functions throws ', async () => {
    const projectConfig = newProjectConfig(
      'customSnapshotResolver-inconsistent-fns.js',
    );
    await expect(
      buildSnapshotResolver(projectConfig),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});
