/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Module as VMModule} from 'node:vm';
import {ModuleRegistries} from '../ModuleRegistries';
import type {InitialModule, JestModule} from '../moduleTypes';

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
      const registries = new ModuleRegistries();
      const cjsModule = fakeCjs('/a.js');
      registries.setCjs('/a.js', cjsModule);
      expect(registries.hasCjs('/a.js')).toBe(true);
      expect(registries.getCjs('/a.js')).toBe(cjsModule);
    });

    test('reads/writes go to the isolated overlay during isolation', () => {
      const registries = new ModuleRegistries();
      const main = fakeCjs('/a.js');
      registries.setCjs('/a.js', main);

      registries.enterIsolated('isolateModules');
      expect(registries.hasCjs('/a.js')).toBe(false);

      const isolated = fakeCjs('/a.js');
      registries.setCjs('/a.js', isolated);
      expect(registries.getCjs('/a.js')).toBe(isolated);

      registries.exitIsolated();
      expect(registries.getCjs('/a.js')).toBe(main);
    });

    test('internal CJS bypasses isolation', () => {
      const registries = new ModuleRegistries();
      const cjsModule = fakeCjs('/a.js');
      registries.setInternalCjs('/a.js', cjsModule);

      registries.enterIsolated('isolateModules');
      expect(registries.hasInternalCjs('/a.js')).toBe(true);
      expect(registries.getInternalCjs('/a.js')).toBe(cjsModule);
    });
  });

  describe('isolation lifecycle', () => {
    test('throws on nested entry with caller-specific message', () => {
      const registries = new ModuleRegistries();
      registries.enterIsolated('isolateModules');
      expect(() => registries.enterIsolated('isolateModulesAsync')).toThrow(
        'isolateModulesAsync cannot be nested inside another isolateModulesAsync or isolateModules.',
      );
    });

    test('exitIsolated empties the overlay maps before dropping the reference', () => {
      const registries = new ModuleRegistries();
      registries.enterIsolated('isolateModules');
      registries.setCjs('/a.js', fakeCjs('/a.js'));
      registries.setEsm('/b.mjs', fakeEsm() as JestModule);
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

      expect(registries.isIsolated()).toBe(false);
      expect(cjsOverlay.size).toBe(0);
      expect(esmOverlay.size).toBe(0);
      expect(mockOverlay.size).toBe(0);

      expect(registries.hasCjs('/a.js')).toBe(false);
      expect(registries.hasMock('id')).toBe(false);
    });
  });

  describe('withScratchRegistries', () => {
    test('runs fn against fresh CJS + mock maps and restores originals', () => {
      const registries = new ModuleRegistries();
      const orig = fakeCjs('/a.js');
      registries.setCjs('/a.js', orig);
      registries.setMock('id', 'orig-mock');

      const result = registries.withScratchRegistries(() => {
        expect(registries.hasCjs('/a.js')).toBe(false);
        expect(registries.hasMock('id')).toBe(false);
        registries.setCjs('/scratch.js', fakeCjs('/scratch.js'));
        registries.setMock('scratch-id', 'scratch-mock');
        return 'done';
      });

      expect(result).toBe('done');
      expect(registries.getCjs('/a.js')).toBe(orig);
      expect(registries.getMock('id')).toBe('orig-mock');
      expect(registries.hasCjs('/scratch.js')).toBe(false);
      expect(registries.hasMock('scratch-id')).toBe(false);
    });

    test('restores originals even when fn throws', () => {
      const registries = new ModuleRegistries();
      const orig = fakeCjs('/a.js');
      registries.setCjs('/a.js', orig);

      expect(() =>
        registries.withScratchRegistries(() => {
          throw new Error('boom');
        }),
      ).toThrow('boom');
      expect(registries.getCjs('/a.js')).toBe(orig);
    });
  });

  describe('require.cache Proxy', () => {
    test('exposes CJS modules and live ESM entries; hides Promise / unlinked', () => {
      const registries = new ModuleRegistries();
      const cjs = fakeCjs('/cjs.js');
      registries.setCjs('/cjs.js', cjs);

      const liveEsm = fakeEsm('evaluated');
      registries.setEsm('/live.mjs', liveEsm as JestModule);

      const unlinkedEsm = fakeEsm('unlinked');
      registries.setEsm('/unlinked.mjs', unlinkedEsm as JestModule);

      const pending = Promise.resolve(fakeEsm()) as unknown as JestModule;
      registries.setEsm('/pending.mjs', pending);

      const cache = registries.createRequireCacheProxy();

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
      expect(keys).toContain('/live.mjs');
      expect(keys).not.toContain('/unlinked.mjs');
      expect(keys).not.toContain('/pending.mjs');
    });

    test('mutators silently no-op rather than throw', () => {
      const registries = new ModuleRegistries();
      const cache = registries.createRequireCacheProxy();
      // @ts-expect-error: write-through is intentionally not supported
      cache['/x.js'] = fakeCjs('/x.js');
      expect(cache['/x.js']).toBeUndefined();
      expect(delete cache['/x.js']).toBe(true);
    });

    test('wrapEsmForRequireCache caches the wrapper per VMModule', () => {
      const registries = new ModuleRegistries();
      const esm = fakeEsm('evaluated');
      const wrapper = registries.wrapEsmForRequireCache('/x.mjs', esm);
      const wrapperAgain = registries.wrapEsmForRequireCache('/x.mjs', esm);
      expect(wrapper).toBe(wrapperAgain);
    });
  });

  describe('clear semantics', () => {
    test('clearForReset drops everything except internal CJS', () => {
      const registries = new ModuleRegistries();
      registries.setCjs('/a.js', fakeCjs('/a.js'));
      registries.setEsm('/b.mjs', fakeEsm() as JestModule);
      registries.setMock('id', 'mock');
      registries.setModuleMock('mid', fakeEsm() as JestModule);
      registries.setInternalCjs('/i.js', fakeCjs('/i.js'));

      registries.clearForReset();
      expect(registries.hasCjs('/a.js')).toBe(false);
      expect(registries.hasEsm('/b.mjs')).toBe(false);
      expect(registries.hasMock('id')).toBe(false);
      expect(registries.hasModuleMock('mid')).toBe(false);
      expect(registries.hasInternalCjs('/i.js')).toBe(true);
    });

    test('clear drops everything including internal CJS', () => {
      const registries = new ModuleRegistries();
      registries.setInternalCjs('/i.js', fakeCjs('/i.js'));
      registries.clear();
      expect(registries.hasInternalCjs('/i.js')).toBe(false);
    });
  });
});
