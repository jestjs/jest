/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {BrowserRpcEvents} from '../node/types';

type TesterResponseEvent = {
  event: 'response:cleanup' | 'response:execute' | 'response:prepare';
  sessionId: string;
};

export function createOrchestratorClient(options: {
  isolated: boolean;
  responseTimeoutMs: number;
  sessionId: string;
}): BrowserRpcEvents {
  const channel = new BroadcastChannel(`jest:${options.sessionId}`);
  const iframes: Array<HTMLIFrameElement> = [];
  const listeners = new Set<(data: unknown) => void>();

  channel.addEventListener('message', message => {
    for (const listener of listeners) {
      listener(message.data);
    }
  });

  function waitForResponse(
    event: TesterResponseEvent['event'],
    sessionId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = globalThis.setTimeout(() => {
        listeners.delete(onData);
        reject(new Error(`Timed out waiting for ${event}`));
      }, options.responseTimeoutMs);

      const onData = (data: unknown): void => {
        const incoming = data as Partial<TesterResponseEvent>;
        if (incoming.event !== event || incoming.sessionId !== sessionId) {
          return;
        }

        globalThis.clearTimeout(timeout);
        listeners.delete(onData);
        resolve();
      };

      listeners.add(onData);
    });
  }

  function createIframe(sessionId: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.src = `/?sessionId=${encodeURIComponent(sessionId)}`;
    document.body.append(iframe);
    iframes.push(iframe);
    return iframe;
  }

  return {
    cleanupTesters: async () => {
      channel.postMessage({
        event: 'cleanup',
        sessionId: options.sessionId,
      });

      await waitForResponse('response:cleanup', options.sessionId);

      for (const iframe of iframes.splice(0)) {
        iframe.remove();
      }
    },
    createTesters: async opts => {
      if (options.isolated) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const _ of opts.testFiles) {
          createIframe(opts.sessionId);
        }
      } else {
        createIframe(opts.sessionId);
      }

      channel.postMessage({
        event: 'prepare',
        sessionId: opts.sessionId,
      });

      await waitForResponse('response:prepare', opts.sessionId);

      if (!options.isolated) {
        channel.postMessage({
          event: 'execute',
          sessionId: opts.sessionId,
          testFiles: opts.testFiles,
        });
        return;
      }

      for (const file of opts.testFiles) {
        channel.postMessage({
          event: 'execute',
          sessionId: opts.sessionId,
          testFiles: [file],
        });
      }
    },
  };
}
