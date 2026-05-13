/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {BrowserProvider, BrowserProviderOptions} from './provider/types';

export type BrowserCommand = (
  context: CommandContext,
  ...args: Array<any>
) => Promise<any>;

export interface CommandContext {
  context: any;
  page: any;
}

export interface BrowserProviderPlugin {
  name: string;
  setup: (
    options: BrowserProviderOptions,
  ) => Promise<
    BrowserProvider & {getCommands(): Record<string, BrowserCommand>}
  >;
}

export type BrowserProviderWithCommands = BrowserProvider & {
  getCommands(): Record<string, BrowserCommand>;
};

export function defineBrowserProvider(
  plugin: BrowserProviderPlugin,
): BrowserProviderPlugin {
  return plugin;
}

function assertProviderPlugin(
  providerPath: string,
  plugin: unknown,
): asserts plugin is BrowserProviderPlugin {
  if (plugin == null || typeof plugin !== 'object') {
    throw new Error(`Invalid provider plugin from "${providerPath}"`);
  }

  const candidate = plugin as Partial<BrowserProviderPlugin>;

  if (typeof candidate.name !== 'string' || candidate.name === '') {
    throw new Error(
      `Invalid provider plugin from "${providerPath}": missing name`,
    );
  }

  if (typeof candidate.setup !== 'function') {
    throw new TypeError(
      `Invalid provider plugin from "${providerPath}": missing setup()`,
    );
  }
}

function assertProviderContract(
  providerPath: string,
  provider: unknown,
): asserts provider is BrowserProviderWithCommands {
  if (provider == null || typeof provider !== 'object') {
    throw new Error(`Invalid provider from "${providerPath}"`);
  }

  const candidate = provider as Partial<BrowserProvider> & {
    getCommands?: unknown;
  };

  if (typeof candidate.getCommands !== 'function') {
    throw new TypeError(
      `Invalid provider from "${providerPath}": getCommands() is required`,
    );
  }
}

const BUILTIN_PROVIDERS: Record<string, string> = {
  playwright: '@jest/browser-playwright',
};

export async function resolveProvider(
  providerPath: string,
  validateContract = true,
): Promise<BrowserProviderPlugin> {
  const resolvedPath = BUILTIN_PROVIDERS[providerPath] ?? providerPath;
  let mod: Record<string, unknown> | null = null;

  if (typeof require === 'function') {
    try {
      mod = require(resolvedPath) as Record<string, unknown>;
    } catch {
      mod = null;
    }
  }

  mod ??= (await import(resolvedPath)) as Record<string, unknown>;

  const playwrightFactory =
    typeof mod.playwright === 'function' ? mod.playwright : undefined;
  const rawPlugin = mod.default ?? playwrightFactory?.() ?? mod;
  const plugin =
    typeof rawPlugin === 'function'
      ? (rawPlugin as () => BrowserProviderPlugin)()
      : rawPlugin;

  assertProviderPlugin(providerPath, plugin);

  if (!validateContract) {
    return plugin;
  }

  const probeProvider = await plugin.setup({browser: 'chromium'});
  assertProviderContract(providerPath, probeProvider);
  await probeProvider.close();

  return plugin;
}
