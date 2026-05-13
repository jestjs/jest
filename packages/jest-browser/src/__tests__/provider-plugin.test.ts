/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it, jest} from '@jest/globals';
import * as fs from 'graceful-fs';
import path from 'node:path';

import * as browser from '../index';

const runBrowserTestSourcePath = path.resolve(
  __dirname,
  '..',
  'runBrowserTest.ts',
);
const runBrowserTestSource = fs.readFileSync(runBrowserTestSourcePath, 'utf8');

describe('provider plugin architecture', () => {
  it('defineBrowserProvider returns factory', async () => {
    expect(typeof (browser as any).defineBrowserProvider).toBe('function');

    const setup = jest.fn(async () => ({
      close: async () => {},
      getCommands: () => ({__jest_click: async () => {}}),
      open: async () => {},
      openPage: async () => ({
        close: async () => {},
        evaluate: async () => null,
        goto: async () => {},
        waitForClose: async () => {},
      }),
    }));

    const providerFactory = (browser as any).defineBrowserProvider({
      name: 'custom-provider',
      setup,
    });

    expect(providerFactory).toEqual(
      expect.objectContaining({
        name: 'custom-provider',
      }),
    );
    expect(typeof providerFactory.setup).toBe('function');
  });

  it('provider loaded dynamically from string', async () => {
    jest.mock(
      '@jest/browser-playwright',
      () => ({
        default: {
          name: 'playwright',
          setup: async () => ({
            close: async () => {},
            getCommands: () => ({__jest_click: async () => {}}),
            open: async () => {},
            openPage: async () => ({
              close: async () => {},
              evaluate: async () => null,
              goto: async () => {},
              waitForClose: async () => {},
            }),
          }),
        },
      }),
      {virtual: true},
    );

    expect(typeof (browser as any).resolveProvider).toBe('function');

    const resolved = await (browser as any).resolveProvider(
      '@jest/browser-playwright',
    );

    expect(resolved).toEqual(
      expect.objectContaining({
        name: 'playwright',
      }),
    );
  });

  it('provider interface contract enforced', async () => {
    jest.mock(
      '@jest/browser-bad-provider',
      () => ({
        default: {
          name: 'bad-provider',
          setup: async () => ({
            close: async () => {},
            open: async () => {},
            openPage: async () => ({
              close: async () => {},
              evaluate: async () => null,
              goto: async () => {},
              waitForClose: async () => {},
            }),
          }),
        },
      }),
      {virtual: true},
    );

    expect(typeof (browser as any).resolveProvider).toBe('function');

    await expect(
      (browser as any).resolveProvider('@jest/browser-bad-provider'),
    ).rejects.toThrow(/getCommands|provider/i);
  });

  it('commands dispatched through provider command registry', () => {
    expect(runBrowserTestSource).toMatch(/triggerCommand\(/);
    expect(runBrowserTestSource).toMatch(/provider\.getCommands\(\)/);
    expect(runBrowserTestSource).toMatch(/__jest_click/);
  });

  it('host no longer imports playwright directly', () => {
    expect(runBrowserTestSource).not.toMatch(/import\(['"]playwright['"]\)/);
    expect(runBrowserTestSource).not.toMatch(/require\(['"]playwright['"]\)/);
    expect(runBrowserTestSource).not.toContain('PlaywrightBrowserProvider');
  });
});
