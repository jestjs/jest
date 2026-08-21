/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {execFile} from 'node:child_process';
import {EventEmitter} from 'node:events';
import * as net from 'node:net';
import * as fs from 'graceful-fs';

jest.mock('node:child_process');
jest.mock('node:net');
jest.mock('graceful-fs', () => ({
  readFileSync: jest.fn(),
  rmSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

const mockExecFile = jest.mocked(execFile);
const mockCreateConnection = jest.mocked(net.createConnection);
const mockReadFileSync = jest.mocked(fs.readFileSync);
const mockRmSync = jest.mocked(fs.rmSync);
const mockWriteFileSync = jest.mocked(fs.writeFileSync);

type WatchmanSocknameModule = typeof import('../watchmanSockname');

// The availability promise is memoized at module level, so every test loads
// a fresh copy of the module.
function loadModule(): WatchmanSocknameModule {
  let module!: WatchmanSocknameModule;
  jest.isolateModules(() => {
    module = require('../watchmanSockname') as WatchmanSocknameModule;
  });
  return module;
}

type FakeSocket = EventEmitter & {destroy: jest.Mock};

function mockSocketConnection(connects: boolean): FakeSocket {
  const socket = Object.assign(new EventEmitter(), {destroy: jest.fn()});
  mockCreateConnection.mockImplementation(((
    _sockname: string,
    onConnect?: () => void,
  ) => {
    process.nextTick(() => {
      if (connects) {
        onConnect?.();
      } else {
        socket.emit('error', new Error('ECONNREFUSED'));
      }
    });
    return socket;
  }) as unknown as typeof net.createConnection);
  return socket;
}

function mockGetSocknameResult(stdout: string): void {
  mockExecFile.mockImplementation(((
    _file: string,
    _args: Array<string>,
    callback: (error: Error | null, result: {stdout: string}) => void,
  ) => {
    callback(null, {stdout});
  }) as unknown as typeof execFile);
}

function mockGetSocknameFailure(error: Error): void {
  mockExecFile.mockImplementation(((
    _file: string,
    _args: Array<string>,
    callback: (error: Error | null, result: {stdout: string}) => void,
  ) => {
    callback(error, {stdout: ''});
  }) as unknown as typeof execFile);
}

function readError(): NodeJS.ErrnoException {
  const error: NodeJS.ErrnoException = new Error('ENOENT');
  error.code = 'ENOENT';
  return error;
}

const originalWatchmanSock = process.env.WATCHMAN_SOCK;

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.WATCHMAN_SOCK;
  mockReadFileSync.mockImplementation(() => {
    throw readError();
  });
});

afterAll(() => {
  if (originalWatchmanSock === undefined) {
    delete process.env.WATCHMAN_SOCK;
  } else {
    process.env.WATCHMAN_SOCK = originalWatchmanSock;
  }
});

describe('getWatchmanAvailability', () => {
  it('uses WATCHMAN_SOCK from the environment without probing or spawning', async () => {
    process.env.WATCHMAN_SOCK = '/env/sock';
    const {getWatchmanAvailability} = loadModule();

    expect(await getWatchmanAvailability('/cache')).toEqual({
      installed: true,
      sockname: '/env/sock',
    });
    expect(mockReadFileSync).not.toHaveBeenCalled();
    expect(mockCreateConnection).not.toHaveBeenCalled();
    expect(mockExecFile).not.toHaveBeenCalled();
  });

  it('uses a cached sockname that accepts connections, without spawning', async () => {
    mockReadFileSync.mockReturnValue('/cached/sock\n');
    const socket = mockSocketConnection(true);
    const {getWatchmanAvailability} = loadModule();

    expect(await getWatchmanAvailability('/cache')).toEqual({
      installed: true,
      sockname: '/cached/sock',
    });
    expect(mockCreateConnection).toHaveBeenCalledWith(
      '/cached/sock',
      expect.any(Function),
    );
    expect(socket.destroy).toHaveBeenCalled();
    expect(mockExecFile).not.toHaveBeenCalled();
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('replaces a stale cached sockname by running get-sockname once', async () => {
    mockReadFileSync.mockReturnValue('/stale/sock');
    mockSocketConnection(false);
    mockGetSocknameResult(JSON.stringify({sockname: '/fresh/sock'}));
    const {getWatchmanAvailability} = loadModule();

    expect(await getWatchmanAvailability('/cache')).toEqual({
      installed: true,
      sockname: '/fresh/sock',
    });
    expect(mockExecFile).toHaveBeenCalledTimes(1);
    expect(mockExecFile).toHaveBeenCalledWith(
      'watchman',
      ['--no-pretty', 'get-sockname'],
      expect.any(Function),
    );
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('haste-map-watchman-sockname-'),
      '/fresh/sock',
    );
  });

  it('runs get-sockname and writes the cache when no sockname is cached', async () => {
    mockGetSocknameResult(JSON.stringify({sockname: '/fresh/sock'}));
    const {getWatchmanAvailability} = loadModule();

    expect(await getWatchmanAvailability('/cache')).toEqual({
      installed: true,
      sockname: '/fresh/sock',
    });
    expect(mockCreateConnection).not.toHaveBeenCalled();
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
  });

  it('reports watchman as not installed when the binary cannot be spawned', async () => {
    const spawnError: NodeJS.ErrnoException = new Error('spawn watchman');
    spawnError.code = 'ENOENT';
    mockGetSocknameFailure(spawnError);
    const {getWatchmanAvailability} = loadModule();

    expect(await getWatchmanAvailability('/cache')).toEqual({
      installed: false,
      sockname: undefined,
    });
  });

  it('reports watchman as installed but without a sockname when get-sockname exits non-zero', async () => {
    mockGetSocknameFailure(Object.assign(new Error('exit 1'), {code: 1}));
    const {getWatchmanAvailability} = loadModule();

    expect(await getWatchmanAvailability('/cache')).toEqual({
      installed: true,
      sockname: undefined,
    });
  });

  it('reports watchman as installed but without a sockname when the spawn fails for a reason other than a missing binary', async () => {
    mockGetSocknameFailure(
      Object.assign(new Error('stdout maxBuffer length exceeded'), {
        code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER',
      }),
    );
    const {getWatchmanAvailability} = loadModule();

    expect(await getWatchmanAvailability('/cache')).toEqual({
      installed: true,
      sockname: undefined,
    });
  });

  it('removes a stale cache entry when get-sockname fails', async () => {
    mockReadFileSync.mockReturnValue('/stale/sock');
    mockSocketConnection(false);
    mockGetSocknameFailure(Object.assign(new Error('exit 1'), {code: 1}));
    const {getWatchmanAvailability} = loadModule();

    await getWatchmanAvailability('/cache');
    expect(mockRmSync).toHaveBeenCalledWith(
      expect.stringContaining('haste-map-watchman-sockname-'),
      {force: true},
    );
  });

  it('resolves availability when a stale cache entry cannot be removed', async () => {
    mockReadFileSync.mockReturnValue('/stale/sock');
    mockSocketConnection(false);
    mockRmSync.mockImplementation(() => {
      throw Object.assign(new Error('EACCES'), {code: 'EACCES'});
    });
    mockGetSocknameResult(JSON.stringify({sockname: '/fresh/sock'}));
    const {getWatchmanAvailability} = loadModule();

    expect(await getWatchmanAvailability('/cache')).toEqual({
      installed: true,
      sockname: '/fresh/sock',
    });
  });

  it('reports availability when a stale cache entry cannot be removed and get-sockname fails', async () => {
    mockReadFileSync.mockReturnValue('/stale/sock');
    mockSocketConnection(false);
    mockRmSync.mockImplementation(() => {
      throw Object.assign(new Error('EACCES'), {code: 'EACCES'});
    });
    mockGetSocknameFailure(Object.assign(new Error('exit 1'), {code: 1}));
    const {getWatchmanAvailability} = loadModule();

    expect(await getWatchmanAvailability('/cache')).toEqual({
      installed: true,
      sockname: undefined,
    });
  });

  it('reports watchman as installed but without a sockname on unparseable output', async () => {
    mockGetSocknameResult('not json');
    const {getWatchmanAvailability} = loadModule();

    expect(await getWatchmanAvailability('/cache')).toEqual({
      installed: true,
      sockname: undefined,
    });
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('resolves availability only once across calls', async () => {
    mockGetSocknameResult(JSON.stringify({sockname: '/fresh/sock'}));
    const {getWatchmanAvailability} = loadModule();

    const first = await getWatchmanAvailability('/cache');
    const second = await getWatchmanAvailability('/other-cache');
    expect(second).toBe(first);
    expect(mockExecFile).toHaveBeenCalledTimes(1);
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
  });
});

describe('connectClientToSockname', () => {
  it('exposes the sockname through WATCHMAN_SOCK only while connect runs', () => {
    const {connectClientToSockname} = loadModule();
    let socknameDuringConnect: string | undefined;
    const client = {
      connect: jest.fn(() => {
        socknameDuringConnect = process.env.WATCHMAN_SOCK;
      }),
    };

    connectClientToSockname(client as never, '/scoped/sock');

    expect(client.connect).toHaveBeenCalledTimes(1);
    expect(socknameDuringConnect).toBe('/scoped/sock');
    expect(process.env.WATCHMAN_SOCK).toBeUndefined();
  });

  it('restores a pre-existing WATCHMAN_SOCK value', () => {
    const {connectClientToSockname} = loadModule();
    process.env.WATCHMAN_SOCK = '/previous/sock';
    const client = {connect: jest.fn()};

    connectClientToSockname(client as never, '/scoped/sock');

    expect(process.env.WATCHMAN_SOCK).toBe('/previous/sock');
  });

  it('restores WATCHMAN_SOCK when connect throws', () => {
    const {connectClientToSockname} = loadModule();
    const client = {
      connect: jest.fn(() => {
        throw new Error('boom');
      }),
    };

    expect(() =>
      connectClientToSockname(client as never, '/scoped/sock'),
    ).toThrow('boom');
    expect(process.env.WATCHMAN_SOCK).toBeUndefined();
  });
});
