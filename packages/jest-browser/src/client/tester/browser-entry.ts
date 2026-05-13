/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Browser-side entry for `@jest/browser` virtual module.
 * Provides: page, userEvent, commands, server.
 * Uses birpc RPC from globals-entry via __browserInternals.
 */

import {__browserInternals} from './globals-entry';
import {createPage} from './page';

// page is created here (browser-only API), using RPC from globals-entry internals
const page = createPage(
  async (cmd, ...args) => {
    await __browserInternals.initRpc();
    return __browserInternals.rpc!.triggerCommand(cmd, args);
  },
  {
    pageScreenshot: async (opts?: any) => {
      await __browserInternals.initRpc();
      return __browserInternals.rpc!.pageScreenshot(opts);
    },
    screenshotSave: async (opts: any) => {
      await __browserInternals.initRpc();
      return __browserInternals.rpc!.screenshotSave(opts);
    },
    toSelector: __browserInternals.toSelector,
  },
);

export {page};

async function getRpc(): Promise<
  NonNullable<(typeof __browserInternals)['rpc']>
> {
  await __browserInternals.initRpc();
  return __browserInternals.rpc!;
}

// --- commands ---

export const commands = {
  async removeFile(filePath: string): Promise<void> {
    const rpc = await getRpc();
    return rpc.removeFile(filePath);
  },
};

// --- userEvent ---

export const userEvent = {
  async clear(element: unknown): Promise<unknown> {
    const selector = __browserInternals.toSelector(element);
    const rpc = await getRpc();
    return rpc.triggerCommand('__clear', [selector]);
  },
  async click(element: unknown): Promise<unknown> {
    const selector = __browserInternals.toSelector(element);
    const rpc = await getRpc();
    return rpc.triggerCommand('__click', [selector]);
  },
  async dblClick(element: unknown): Promise<unknown> {
    const selector = __browserInternals.toSelector(element);
    const rpc = await getRpc();
    return rpc.triggerCommand('__dblClick', [selector]);
  },
  async fill(element: unknown, value: string): Promise<unknown> {
    const selector = __browserInternals.toSelector(element);
    const rpc = await getRpc();
    return rpc.triggerCommand('__fill', [selector, value]);
  },
  async hover(element: unknown): Promise<unknown> {
    const selector = __browserInternals.toSelector(element);
    const rpc = await getRpc();
    return rpc.triggerCommand('__hover', [selector]);
  },
  async keyboard(text: string): Promise<unknown> {
    const rpc = await getRpc();
    return rpc.triggerCommand('__keyboard', [text]);
  },
  async selectOptions(
    element: unknown,
    values: Array<string> | string,
  ): Promise<unknown> {
    const selector = __browserInternals.toSelector(element);
    const rpc = await getRpc();
    return rpc.triggerCommand('__selectOptions', [selector, values]);
  },
  async tab(): Promise<unknown> {
    const rpc = await getRpc();
    return rpc.triggerCommand('__tab', []);
  },
  async type(element: unknown, text: string): Promise<unknown> {
    const selector = __browserInternals.toSelector(element);
    const rpc = await getRpc();
    return rpc.triggerCommand('__type', [selector, text]);
  },
  async unhover(element: unknown): Promise<unknown> {
    const selector = __browserInternals.toSelector(element);
    const rpc = await getRpc();
    return rpc.triggerCommand('__unhover', [selector]);
  },
};

// --- server ---

export const server = {
  browser: __browserInternals.browser,
  commands,
  platform: __browserInternals.platform,
};
