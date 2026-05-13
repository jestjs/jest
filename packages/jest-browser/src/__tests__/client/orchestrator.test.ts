/**
 * @jest-environment jsdom
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type BroadcastHandler = (event: {data: unknown}) => void;

type OrchestratorModule = {
  createOrchestratorClient: (options: {
    isolated: boolean;
    responseTimeoutMs: number;
    sessionId: string;
  }) => {
    createTesters(opts: {
      sessionId: string;
      testFiles: Array<string>;
    }): Promise<void>;
    cleanupTesters(): Promise<void>;
  };
};

class MockBroadcastChannel {
  static instances: Array<MockBroadcastChannel> = [];

  readonly name: string;

  private readonly _listeners: Array<BroadcastHandler> = [];
  postMessage = jest.fn();
  close = jest.fn();

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  addEventListener(_event: string, handler: BroadcastHandler): void {
    this._listeners.push(handler);
  }

  emit(data: unknown): void {
    for (const listener of this._listeners) {
      listener({data});
    }
  }

  static reset(): void {
    MockBroadcastChannel.instances = [];
  }
}

function loadModule(): OrchestratorModule {
  return require('../../client/orchestrator') as OrchestratorModule;
}

describe('createOrchestratorClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockBroadcastChannel.reset();
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      configurable: true,
      value: MockBroadcastChannel,
      writable: true,
    });
    document.body.innerHTML = '';
  });

  test('creates single tester iframe, sends prepare then execute for non-isolated mode', async () => {
    const {createOrchestratorClient} = loadModule();

    const orchestrator = createOrchestratorClient({
      isolated: false,
      responseTimeoutMs: 100,
      sessionId: 'session-1',
    });

    const createPromise = orchestrator.createTesters({
      sessionId: 'session-1',
      testFiles: ['/repo/a.test.ts', '/repo/b.test.ts'],
    });

    const channel = MockBroadcastChannel.instances[0];
    expect(channel).toBeDefined();

    expect(channel.postMessage).toHaveBeenCalledWith({
      event: 'prepare',
      sessionId: 'session-1',
    });

    channel.emit({
      event: 'response:prepare',
      sessionId: 'session-1',
    });

    await createPromise;

    expect(channel.postMessage).toHaveBeenCalledWith({
      event: 'execute',
      sessionId: 'session-1',
      testFiles: ['/repo/a.test.ts', '/repo/b.test.ts'],
    });

    expect(document.querySelectorAll('iframe')).toHaveLength(1);
  });

  test('creates one iframe per file in isolated mode', async () => {
    const {createOrchestratorClient} = loadModule();

    const orchestrator = createOrchestratorClient({
      isolated: true,
      responseTimeoutMs: 100,
      sessionId: 'session-2',
    });

    const createPromise = orchestrator.createTesters({
      sessionId: 'session-2',
      testFiles: ['/repo/a.test.ts', '/repo/b.test.ts'],
    });

    const channel = MockBroadcastChannel.instances[0];
    channel.emit({event: 'response:prepare', sessionId: 'session-2'});
    await createPromise;

    expect(document.querySelectorAll('iframe')).toHaveLength(2);
    expect(channel.postMessage).toHaveBeenCalledWith({
      event: 'execute',
      sessionId: 'session-2',
      testFiles: ['/repo/a.test.ts'],
    });
    expect(channel.postMessage).toHaveBeenCalledWith({
      event: 'execute',
      sessionId: 'session-2',
      testFiles: ['/repo/b.test.ts'],
    });
  });

  test('cleanup sends cleanup event, waits for ack, removes iframes', async () => {
    const {createOrchestratorClient} = loadModule();

    const orchestrator = createOrchestratorClient({
      isolated: false,
      responseTimeoutMs: 100,
      sessionId: 'session-3',
    });

    const createPromise = orchestrator.createTesters({
      sessionId: 'session-3',
      testFiles: ['/repo/a.test.ts'],
    });

    const channel = MockBroadcastChannel.instances[0];
    channel.emit({event: 'response:prepare', sessionId: 'session-3'});
    await createPromise;

    const cleanupPromise = orchestrator.cleanupTesters();
    expect(channel.postMessage).toHaveBeenCalledWith({
      event: 'cleanup',
      sessionId: 'session-3',
    });

    channel.emit({event: 'response:cleanup', sessionId: 'session-3'});
    await cleanupPromise;

    expect(document.querySelectorAll('iframe')).toHaveLength(0);
  });

  test('throws timeout if prepare ack not received', async () => {
    const {createOrchestratorClient} = loadModule();

    const orchestrator = createOrchestratorClient({
      isolated: false,
      responseTimeoutMs: 1,
      sessionId: 'session-4',
    });

    await expect(
      orchestrator.createTesters({
        sessionId: 'session-4',
        testFiles: ['/repo/a.test.ts'],
      }),
    ).rejects.toThrow('response:prepare');
  });
});
