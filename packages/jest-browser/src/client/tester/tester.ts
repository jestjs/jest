/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable unicorn/prefer-add-event-listener */

import type {TesterChannelEvent} from '../channel';

type TesterResponseEvent = {
  event: 'response:cleanup' | 'response:execute' | 'response:prepare';
  sessionId: string;
};

declare global {
  var __jestBrowserImport: (path: string) => Promise<unknown>;
}

export function startTesterRuntime(options: {
  channelName?: string;
  sessionId: string;
}): {dispose(): Promise<void>} {
  const channel = new BroadcastChannel(
    options.channelName ?? `jest:${options.sessionId}`,
  );

  const post = (event: TesterResponseEvent['event']): void => {
    channel.postMessage({
      event,
      sessionId: options.sessionId,
    } satisfies TesterResponseEvent);
  };

  channel.onmessage = async message => {
    const data = message.data as Partial<TesterChannelEvent>;

    if (data.sessionId !== options.sessionId) {
      return;
    }

    if (data.event === 'prepare') {
      post('response:prepare');
      return;
    }

    if (data.event === 'execute') {
      const testFiles = Array.isArray(data.testFiles) ? data.testFiles : [];
      for (const file of testFiles) {
        void globalThis.__jestBrowserImport(file);
      }

      post('response:execute');
      return;
    }

    if (data.event === 'cleanup') {
      post('response:cleanup');
    }
  };

  return {
    dispose: async () => {
      channel.close();
    },
  };
}
