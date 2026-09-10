/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import {
  type ChangedFiles,
  type Repos,
  findRepos,
  getChangedFilesForRepos,
} from 'jest-changed-files';
import getChangedFilesPromise from '../getChangedFilesPromise';

jest.mock('jest-changed-files', () => ({
  findRepos: jest.fn(),
  getChangedFilesForRepos: jest.fn(),
}));

const findReposMock = jest.mocked(findRepos);
const getChangedFilesForReposMock = jest.mocked(getChangedFilesForRepos);

const createRepos = (): Repos => ({
  git: new Set(),
  hg: new Set(),
  sl: new Set(),
});

const createChangedFiles = (resolvedRepos: Repos): ChangedFiles => ({
  changedFiles: new Set(['/changed.ts']),
  repos: resolvedRepos,
});

const createGlobalConfig = (
  overrides: Partial<Config.GlobalConfig> = {},
): Config.GlobalConfig =>
  ({
    changedFilesWithAncestor: false,
    changedSince: undefined,
    lastCommit: false,
    onlyChanged: true,
    ...overrides,
  }) as Config.GlobalConfig;

const createProjectConfig = (roots: Array<string>): Config.ProjectConfig =>
  ({roots}) as Config.ProjectConfig;

beforeEach(() => {
  jest.clearAllMocks();
});

test('returns undefined without touching the VCS when onlyChanged is not set', () => {
  const result = getChangedFilesPromise(
    createGlobalConfig({onlyChanged: false}),
    [createProjectConfig(['/project-a'])],
  );

  expect(result).toBeUndefined();
  expect(findReposMock).not.toHaveBeenCalled();
  expect(getChangedFilesForReposMock).not.toHaveBeenCalled();
});

test('resolves the VCS roots only once across runs with the same roots', async () => {
  const resolvedRepos = createRepos();
  const resolvedChangedFiles = createChangedFiles(resolvedRepos);
  findReposMock.mockResolvedValue(resolvedRepos);
  getChangedFilesForReposMock.mockResolvedValue(resolvedChangedFiles);

  const globalConfig = createGlobalConfig();
  const configs = [createProjectConfig(['/project-b'])];

  const firstRun = (await getChangedFilesPromise(
    globalConfig,
    configs,
  )) as ChangedFiles;
  const secondRun = (await getChangedFilesPromise(
    globalConfig,
    configs,
  )) as ChangedFiles;

  expect(firstRun).toBe(resolvedChangedFiles);
  expect(secondRun).toBe(resolvedChangedFiles);
  expect(findReposMock).toHaveBeenCalledTimes(1);
  expect(findReposMock).toHaveBeenCalledWith(['/project-b']);
  expect(getChangedFilesForReposMock).toHaveBeenCalledTimes(2);
  expect(getChangedFilesForReposMock).toHaveBeenCalledWith(
    resolvedRepos,
    ['/project-b'],
    {
      changedSince: undefined,
      lastCommit: false,
      withAncestor: false,
    },
  );
});

test('resolves the VCS roots again when the roots change', async () => {
  const resolvedRepos = createRepos();
  findReposMock.mockResolvedValue(resolvedRepos);
  getChangedFilesForReposMock.mockResolvedValue(
    createChangedFiles(resolvedRepos),
  );

  const globalConfig = createGlobalConfig();

  await getChangedFilesPromise(globalConfig, [createProjectConfig(['/c'])]);
  await getChangedFilesPromise(globalConfig, [createProjectConfig(['/d'])]);

  expect(findReposMock).toHaveBeenCalledTimes(2);
  expect(findReposMock).toHaveBeenNthCalledWith(1, ['/c']);
  expect(findReposMock).toHaveBeenNthCalledWith(2, ['/d']);
});
