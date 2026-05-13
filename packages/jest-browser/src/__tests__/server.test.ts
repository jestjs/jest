/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createViteServer} from '../vite/server';

const mockListen = jest.fn().mockResolvedValue(undefined);
const mockViteServer = {
  close: jest.fn(),
  listen: (...args: Array<unknown>) => mockListen(...args),
};

const mockCreateServer = jest.fn().mockResolvedValue(mockViteServer);

jest.mock('../vite/loadVite', () => ({
  loadVite: jest.fn().mockResolvedValue({
    createServer: (...args: Array<unknown>) => mockCreateServer(...args),
  }),
}));

describe('createViteServer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls vite.createServer with expected config', async () => {
    await createViteServer({
      browserName: 'chromium',
      platform: 'browser',
      rootDir: '/repo',
      viteConfig: {define: {'process.env.TEST': '"1"'}},
      wsPort: 9009,
    });

    expect(mockCreateServer).toHaveBeenCalledTimes(1);
    expect(mockCreateServer).toHaveBeenCalledWith(
      expect.objectContaining({
        configFile: false,
        optimizeDeps: {entries: [], include: ['birpc', '@jest/expect-utils']},
        root: '/repo',
        server: expect.objectContaining({
          hmr: false,
          port: 0,
          strictPort: false,
        }),
      }),
    );
    expect(
      (mockCreateServer.mock.calls[0]?.[0] as {plugins: Array<unknown>})
        ?.plugins,
    ).toHaveLength(2);
  });

  test('starts server listen and returns vite server', async () => {
    const server = await createViteServer({
      browserName: 'chromium',
      platform: 'browser',
      rootDir: '/repo',
      wsPort: 9009,
    });

    expect(mockListen).toHaveBeenCalledTimes(1);
    expect(server).toBe(mockViteServer);
  });
});
