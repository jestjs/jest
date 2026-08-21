/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {fileURLToPath, pathToFileURL} from 'node:url';
import type {Module as VMModule} from 'node:vm';
import {ModuleRegistries} from '../ModuleRegistries';
import type {InitialModule, JestModule} from '../moduleTypes';

const LIVE_KEY = pathToFileURL('/live.mjs').href;
const UNLINKED_KEY = pathToFileURL('/unlinked.mjs').href;
const PENDING_KEY = pathToFileURL('/pending.mjs').href;

const fakeCjs = (filename: string): InitialModule =>
  ({
    children: [],
    exports: {},
    filename,
    id: filename,
    isPreloading: false,
    loaded: true,
    path: '/',
  }) as InitialModule;

const fakeEsm = (status: VMModule['status'] = 'evaluated'): VMModule =>
  ({
    namespace: {foo: 'bar'},
    status,
  }) as unknown as VMModule;

describe('ModuleRegistries', () => {
  describe('CJS routing through isolation', () => {
    test('reads/writes go to the main map outside isolation', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      const cjsModule = fakeCjs('/a.js');
      registries.getActiveCjsRegistry().set('/a.js', cjsModule);
      expect(registries.getActiveCjsRegistry().has('/a.js')).toBe(true);
      expect(registries.getActiveCjsRegistry().get('/a.js')).toBe(cjsModule);
    });

    test('reads/writes go to the isolated overlay during isolation', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      const main = fakeCjs('/a.js');
      registries.getActiveCjsRegistry().set('/a.js', main);

      registries.enterIsolated('isolateModules');
      expect(registries.getActiveCjsRegistry().has('/a.js')).toBe(false);

      const isolated = fakeCjs('/a.js');
      registries.getActiveCjsRegistry().set('/a.js', isolated);
      expect(registries.getActiveCjsRegistry().get('/a.js')).toBe(isolated);

      registries.exitIsolated();
      expect(registries.getActiveCjsRegistry().get('/a.js')).toBe(main);
    });

    test('internal CJS bypasses isolation', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      const cjsModule = fakeCjs('/a.js');
      registries.getInternalCjsRegistry().set('/a.js', cjsModule);

      registries.enterIsolated('isolateModules');
      expect(registries.getInternalCjsRegistry().has('/a.js')).toBe(true);
      expect(registries.getInternalCjsRegistry().get('/a.js')).toBe(cjsModule);
    });
  });

  describe('isolation lifecycle', () => {
    test('throws on nested entry with caller-specific message', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      registries.enterIsolated('isolateModules');
      expect(() => registries.enterIsolated('isolateModulesAsync')).toThrow(
        'isolateModulesAsync cannot be nested inside another isolateModulesAsync or isolateModules.',
      );
    });

    test('exitIsolated empties the overlay maps before dropping the reference', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      registries.enterIsolated('isolateModules');
      registries.getActiveCjsRegistry().set('/a.js', fakeCjs('/a.js'));
      registries.getActiveEsmRegistry().set('/b.mjs', fakeEsm() as JestModule);
      registries.setMock('id', 'mock');

      // Capture the live overlay maps so we can prove they are cleared, not
      // merely orphaned for GC.
      const cjsOverlay = registries.getActiveCjsRegistry();
      const esmOverlay = registries.getActiveEsmRegistry();
      const mockOverlay = registries.getActiveMockRegistry();
      expect(cjsOverlay.size).toBe(1);
      expect(esmOverlay.size).toBe(1);
      expect(mockOverlay.size).toBe(1);

      registries.exitIsolated();

      expect(registries.getActiveCjsRegistry()).not.toBe(cjsOverlay);
      expect(cjsOverlay.size).toBe(0);
      expect(esmOverlay.size).toBe(0);
      expect(mockOverlay.size).toBe(0);

      expect(registries.getActiveCjsRegistry().has('/a.js')).toBe(false);
      expect(registries.hasMock('id')).toBe(false);
    });
  });

  describe('module mocks through isolation', () => {
    test('inherits module mocks created outside the isolation block', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      const outer = fakeEsm();
      registries.setModuleMock('id', outer);

      registries.enterIsolated('isolateModules');
      expect(registries.hasModuleMock('id')).toBe(true);
      expect(registries.getModuleMock('id')).toBe(outer);
      registries.exitIsolated();
    });

    test('drops module mocks created inside the isolation block on exit', () => {
      const registries = new ModuleRegistries(module => module.namespace);

      registries.enterIsolated('isolateModulesAsync');
      registries.setModuleMock('id', fakeEsm());
      expect(registries.hasModuleMock('id')).toBe(true);
      registries.exitIsolated();

      expect(registries.hasModuleMock('id')).toBe(false);
      expect(registries.getModuleMock('id')).toBeUndefined();
    });

    test('an inner module mock shadows the outer one without replacing it', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      const outer = fakeEsm();
      const inner = fakeEsm();
      registries.setModuleMock('id', outer);

      registries.enterIsolated('isolateModules');
      registries.setModuleMock('id', inner);
      expect(registries.getModuleMock('id')).toBe(inner);
      registries.exitIsolated();

      expect(registries.getModuleMock('id')).toBe(outer);
    });
  });

  describe('withScratchRegistries', () => {
    test('suspends the isolation overlay so the scratch load cannot leak', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      registries.enterIsolated('isolateModules');
      const isolatedCjs = registries.getActiveCjsRegistry();
      isolatedCjs.set('/isolated.js', fakeCjs('/isolated.js'));

      registries.withScratchRegistries(() => {
        expect(registries.getActiveCjsRegistry()).not.toBe(isolatedCjs);
        expect(registries.getActiveCjsRegistry().has('/isolated.js')).toBe(
          false,
        );
        registries
          .getActiveCjsRegistry()
          .set('/scratch.js', fakeCjs('/scratch.js'));
      });

      expect(registries.getActiveCjsRegistry()).toBe(isolatedCjs);
      expect(registries.getActiveCjsRegistry().has('/isolated.js')).toBe(true);
      expect(registries.getActiveCjsRegistry().has('/scratch.js')).toBe(false);
      registries.exitIsolated();
    });

    test('runs fn against fresh CJS + mock maps and restores originals', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      const orig = fakeCjs('/a.js');
      registries.getActiveCjsRegistry().set('/a.js', orig);
      registries.setMock('id', 'orig-mock');

      const result = registries.withScratchRegistries(() => {
        expect(registries.getActiveCjsRegistry().has('/a.js')).toBe(false);
        expect(registries.hasMock('id')).toBe(false);
        registries
          .getActiveCjsRegistry()
          .set('/scratch.js', fakeCjs('/scratch.js'));
        registries.setMock('scratch-id', 'scratch-mock');
        return 'done';
      });

      expect(result).toBe('done');
      expect(registries.getActiveCjsRegistry().get('/a.js')).toBe(orig);
      expect(registries.getMock('id')).toBe('orig-mock');
      expect(registries.getActiveCjsRegistry().has('/scratch.js')).toBe(false);
      expect(registries.hasMock('scratch-id')).toBe(false);
    });

    test('keeps ESM and module-mock writes out of the long-lived registries', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      registries.enterIsolated('isolateModules');

      registries.withScratchRegistries(() => {
        registries.getActiveEsmRegistry().set('/scratch.mjs', fakeEsm());
        registries.setModuleMock('scratch-id', fakeEsm());
      });

      registries.exitIsolated();

      expect(registries.getActiveEsmRegistry().has('/scratch.mjs')).toBe(false);
      expect(registries.hasModuleMock('scratch-id')).toBe(false);
    });

    test('restores originals even when fn throws', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      const orig = fakeCjs('/a.js');
      registries.getActiveCjsRegistry().set('/a.js', orig);

      expect(() =>
        registries.withScratchRegistries(() => {
          throw new Error('boom');
        }),
      ).toThrow('boom');
      expect(registries.getActiveCjsRegistry().get('/a.js')).toBe(orig);
    });
  });

  describe('require.cache Proxy', () => {
    test('hands out one proxy for every module', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      expect(registries.getRequireCacheProxy()).toBe(
        registries.getRequireCacheProxy(),
      );
    });

    test('exposes CJS modules and live ESM entries; hides Promise / unlinked', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      const cjs = fakeCjs('/cjs.js');
      registries.getActiveCjsRegistry().set('/cjs.js', cjs);

      const liveEsm = fakeEsm('evaluated');
      registries.getActiveEsmRegistry().set(LIVE_KEY, liveEsm as JestModule);

      const unlinkedEsm = fakeEsm('unlinked');
      registries
        .getActiveEsmRegistry()
        .set(UNLINKED_KEY, unlinkedEsm as JestModule);

      const pending = Promise.resolve(fakeEsm()) as unknown as JestModule;
      registries.getActiveEsmRegistry().set(PENDING_KEY, pending);

      const cache = registries.getRequireCacheProxy();

      expect(cache['/cjs.js']).toBe(cjs);
      expect('/cjs.js' in cache).toBe(true);

      const wrapped = cache['/live.mjs'];
      expect(wrapped).toBeDefined();
      expect(wrapped?.exports).toEqual({foo: 'bar'});
      expect(wrapped?.filename).toBe('/live.mjs');
      expect('/live.mjs' in cache).toBe(true);

      expect(cache['/unlinked.mjs']).toBeUndefined();
      expect('/unlinked.mjs' in cache).toBe(false);
      expect(cache['/pending.mjs']).toBeUndefined();
      expect('/pending.mjs' in cache).toBe(false);

      const keys = Object.keys(cache);
      expect(keys).toContain('/cjs.js');
      expect(keys).toContain(fileURLToPath(LIVE_KEY));
      expect(keys).not.toContain(fileURLToPath(UNLINKED_KEY));
      expect(keys).not.toContain(fileURLToPath(PENDING_KEY));
    });

    test('mutators silently no-op rather than throw', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      const cache = registries.getRequireCacheProxy();
      // @ts-expect-error: write-through is intentionally not supported
      cache['/x.js'] = fakeCjs('/x.js');
      expect(cache['/x.js']).toBeUndefined();
      expect(delete cache['/x.js']).toBe(true);
    });

    test('hides ESM instances that carry a query or fragment', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      registries
        .getActiveEsmRegistry()
        .set(`${LIVE_KEY}?q=1`, fakeEsm('evaluated') as JestModule);
      registries
        .getActiveEsmRegistry()
        .set(`${LIVE_KEY}#frag`, fakeEsm('evaluated') as JestModule);

      const cache = registries.getRequireCacheProxy();
      expect(Object.keys(cache)).toEqual([]);
      expect(cache['/live.mjs']).toBeUndefined();
      expect('/live.mjs' in cache).toBe(false);
      expect(cache[`${LIVE_KEY}?q=1`]).toBeUndefined();
    });

    test('does not address file entries by URL string', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      registries
        .getActiveEsmRegistry()
        .set(LIVE_KEY, fakeEsm('evaluated') as JestModule);

      const cache = registries.getRequireCacheProxy();
      expect(cache['/live.mjs']).toBeDefined();
      expect(cache[LIVE_KEY]).toBeUndefined();
      expect(LIVE_KEY in cache).toBe(false);
    });

    test('wrapEsmForRequireCache caches the wrapper per VMModule', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      const esm = fakeEsm('evaluated');
      const wrapper = registries.wrapEsmForRequireCache('/x.mjs', esm);
      const wrapperAgain = registries.wrapEsmForRequireCache('/x.mjs', esm);
      expect(wrapper).toBe(wrapperAgain);
    });
  });

  describe('clear semantics', () => {
    test('clearForReset drops everything except internal CJS', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      registries.getActiveCjsRegistry().set('/a.js', fakeCjs('/a.js'));
      registries.getActiveEsmRegistry().set('/b.mjs', fakeEsm() as JestModule);
      registries.setMock('id', 'mock');
      registries.setModuleMock('mid', fakeEsm() as JestModule);
      registries.getInternalCjsRegistry().set('/i.js', fakeCjs('/i.js'));

      registries.clearForReset();
      expect(registries.getActiveCjsRegistry().has('/a.js')).toBe(false);
      expect(registries.getActiveEsmRegistry().has('/b.mjs')).toBe(false);
      expect(registries.hasMock('id')).toBe(false);
      expect(registries.hasModuleMock('mid')).toBe(false);
      expect(registries.getInternalCjsRegistry().has('/i.js')).toBe(true);
    });

    test('clear drops everything including internal CJS', () => {
      const registries = new ModuleRegistries(module => module.namespace);
      registries.getInternalCjsRegistry().set('/i.js', fakeCjs('/i.js'));
      registries.clear();
      expect(registries.getInternalCjsRegistry().has('/i.js')).toBe(false);
    });
  });
});
