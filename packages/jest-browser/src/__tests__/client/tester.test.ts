/**
 * @jest-environment jsdom
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type BroadcastHandler = (event: {data: unknown}) => void;

type TesterBootstrapModule = {
  startTesterRuntime: (options: {channelName?: string; sessionId: string}) => {
    dispose(): Promise<void>;
  };
};

class MockBroadcastChannel {
  static instances: Array<MockBroadcastChannel> = [];

  readonly name: string;

  onmessage: BroadcastHandler | null = null;
  postMessage = jest.fn();
  close = jest.fn();

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  emit(data: unknown): void {
    this.onmessage?.({data});
  }

  static reset(): void {
    MockBroadcastChannel.instances = [];
  }
}

function loadModule(): TesterBootstrapModule {
  return require('../../client/tester/tester') as TesterBootstrapModule;
}

describe('startTesterRuntime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockBroadcastChannel.reset();
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      configurable: true,
      value: MockBroadcastChannel,
      writable: true,
    });
  });

  test('prepare event initializes runner and responds response:prepare', async () => {
    const {startTesterRuntime} = loadModule();

    startTesterRuntime({sessionId: 'session-1'});

    const channel = MockBroadcastChannel.instances[0];
    channel.emit({event: 'prepare', sessionId: 'session-1'});

    await Promise.resolve();

    expect(channel.postMessage).toHaveBeenCalledWith({
      event: 'response:prepare',
      sessionId: 'session-1',
    });
  });

  test('execute event imports each file and responds response:execute', async () => {
    const imported: Array<string> = [];
    Object.defineProperty(globalThis, '__jestBrowserImport', {
      configurable: true,
      value: jest.fn(async (path: string) => {
        imported.push(path);
      }),
      writable: true,
    });

    const {startTesterRuntime} = loadModule();
    startTesterRuntime({sessionId: 'session-2'});

    const channel = MockBroadcastChannel.instances[0];
    channel.emit({
      event: 'execute',
      sessionId: 'session-2',
      testFiles: ['/repo/a.test.ts', '/repo/b.test.ts'],
    });

    await Promise.resolve();

    expect(imported).toEqual(['/repo/a.test.ts', '/repo/b.test.ts']);
    expect(channel.postMessage).toHaveBeenCalledWith({
      event: 'response:execute',
      sessionId: 'session-2',
    });
  });

  test('ignores events from other sessionId', async () => {
    const {startTesterRuntime} = loadModule();
    startTesterRuntime({sessionId: 'session-3'});

    const channel = MockBroadcastChannel.instances[0];
    channel.emit({event: 'prepare', sessionId: 'other-session'});

    await Promise.resolve();

    expect(channel.postMessage).not.toHaveBeenCalled();
  });

  test('cleanup event responds response:cleanup and closes runtime on dispose', async () => {
    const {startTesterRuntime} = loadModule();
    const runtime = startTesterRuntime({sessionId: 'session-4'});

    const channel = MockBroadcastChannel.instances[0];
    channel.emit({event: 'cleanup', sessionId: 'session-4'});

    await Promise.resolve();

    expect(channel.postMessage).toHaveBeenCalledWith({
      event: 'response:cleanup',
      sessionId: 'session-4',
    });

    await runtime.dispose();
    expect(channel.close).toHaveBeenCalledTimes(1);
  });
});
