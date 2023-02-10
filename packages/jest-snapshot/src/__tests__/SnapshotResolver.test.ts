/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {makeProjectConfig} from '@jest/test-utils';
import {SnapshotResolver, buildSnapshotResolver} from '../SnapshotResolver';

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
