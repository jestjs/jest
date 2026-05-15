/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {crawl} from '../index';
import {nodeCrawl} from '../node';
import {watchmanCrawl} from '../watchman';

jest.mock('../node');
jest.mock('../watchman');

const mockNodeCrawl = nodeCrawl as jest.MockedFunction<typeof nodeCrawl>;
const mockWatchmanCrawl = watchmanCrawl as jest.MockedFunction<
  typeof watchmanCrawl
>;

const crawlerOptions = {
  computeSha1: false,
  data: {
    clocks: new Map(),
    duplicates: new Map(),
    files: new Map(),
    map: new Map(),
    mocks: new Map(),
  },
  enableSymlinks: false,
  extensions: ['js'],
  forceNodeFilesystemAPI: false,
  ignore: () => false,
  rootDir: '/root',
  roots: ['/root'],
};

const mockResult = {
  changedFiles: new Map(),
  hasteMap: crawlerOptions.data,
  removedFiles: new Map(),
};

const mockConsole = {warn: jest.fn()} as unknown as Console;

describe('crawl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses watchman when backend is watchman', async () => {
    mockWatchmanCrawl.mockResolvedValue(mockResult);
    await crawl(crawlerOptions, 'watchman', mockConsole);
    expect(mockWatchmanCrawl).toHaveBeenCalledTimes(1);
    expect(mockNodeCrawl).not.toHaveBeenCalled();
  });

  it('uses node when backend is node', async () => {
    mockNodeCrawl.mockResolvedValue(mockResult);
    await crawl(crawlerOptions, 'node', mockConsole);
    expect(mockNodeCrawl).toHaveBeenCalledTimes(1);
    expect(mockWatchmanCrawl).not.toHaveBeenCalled();
  });

  it('uses node when backend is fsevents (no fsevents crawler)', async () => {
    mockNodeCrawl.mockResolvedValue(mockResult);
    await crawl(crawlerOptions, 'fsevents', mockConsole);
    expect(mockNodeCrawl).toHaveBeenCalledTimes(1);
    expect(mockWatchmanCrawl).not.toHaveBeenCalled();
  });

  it('throws when backend is parcel', async () => {
    await expect(crawl(crawlerOptions, 'parcel', mockConsole)).rejects.toThrow(
      '@parcel/watcher backend is not yet supported',
    );
  });

  it('falls back to node when watchman fails', async () => {
    const watchmanError = new Error('watchman unavailable');
    mockWatchmanCrawl.mockRejectedValue(watchmanError);
    mockNodeCrawl.mockResolvedValue(mockResult);

    const result = await crawl(crawlerOptions, 'watchman', mockConsole);
    expect(result).toBe(mockResult);
    expect(mockNodeCrawl).toHaveBeenCalledTimes(1);
  });

  it('throws a combined error when watchman fails and node retry also fails', async () => {
    mockWatchmanCrawl.mockRejectedValue(new Error('watchman error'));
    mockNodeCrawl.mockRejectedValue(new Error('node error'));

    await expect(
      crawl(crawlerOptions, 'watchman', mockConsole),
    ).rejects.toThrow('Crawler retry failed');
  });

  it('combined error message includes both original error messages', async () => {
    mockWatchmanCrawl.mockRejectedValue(new Error('watchman failed'));
    mockNodeCrawl.mockRejectedValue(new Error('node failed'));

    await expect(
      crawl(crawlerOptions, 'watchman', mockConsole),
    ).rejects.toThrow(/watchman failed.*node failed/s);
  });

  it('does not retry when backend is node and node fails', async () => {
    const nodeError = new Error('node error');
    mockNodeCrawl.mockRejectedValue(nodeError);

    await expect(crawl(crawlerOptions, 'node', mockConsole)).rejects.toThrow(
      nodeError,
    );
    expect(mockNodeCrawl).toHaveBeenCalledTimes(1);
  });
});
