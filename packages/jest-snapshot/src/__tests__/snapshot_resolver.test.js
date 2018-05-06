'use strict';
const path = require('path');
const {buildSnapshotResolver} = require('../snapshot_resolver');

describe('defaults', () => {
  let snapshotResolver;
  const projectConfig = {
    rootDir: 'default',
    // snapshotResolver: null,
  };

  beforeEach(() => {
    snapshotResolver = buildSnapshotResolver(projectConfig);
  });

  it('returns cached object if called multiple times', () => {
    expect(buildSnapshotResolver(projectConfig)).toBe(snapshotResolver);
  });

  it('resolveSnapshotPath()', () => {
    expect(snapshotResolver.resolveSnapshotPath('/abc/cde/a.test.js')).toBe(
      path.join('/abc', 'cde', '__snapshots__', 'a.test.js.snap'),
    );
  });

  it('resolveTestPath()', () => {
    expect(
      snapshotResolver.resolveTestPath('/abc/cde/__snapshots__/a.test.js.snap'),
    ).toBe(path.join('/abc', 'cde', 'a.test.js'));
  });
});

describe('custom resolver in project config', () => {
  let snapshotResolver;
  const customSnapshotResolverFile = path.join(
    __dirname,
    'fixtures',
    'customSnapshotResolver.js',
  );
  const projectConfig = {
    rootDir: 'custom1',
    snapshotResolver: customSnapshotResolverFile,
  };

  beforeEach(() => {
    snapshotResolver = buildSnapshotResolver(projectConfig);
  });

  it('returns cached object if called multiple times', () => {
    expect(buildSnapshotResolver(projectConfig)).toBe(snapshotResolver);
  });

  it('resolveSnapshotPath()', () => {
    expect(
      snapshotResolver.resolveSnapshotPath('/abc/cde/__tests__/a.test.js'),
    ).toBe(path.join('/abc', 'cde', '__snapshots__', 'a.test.js.snap'));
  });

  it('resolveTestPath()', () => {
    expect(
      snapshotResolver.resolveTestPath('/abc/cde/__snapshots__/a.test.js.snap'),
    ).toBe(path.join('/abc', 'cde', '__tests__', 'a.test.js'));
  });
});
