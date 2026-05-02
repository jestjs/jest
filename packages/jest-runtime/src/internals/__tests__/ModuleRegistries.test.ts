/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Module as VMModule} from 'node:vm';
import ModuleRegistries from '../ModuleRegistries';
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
      const r = new ModuleRegistries();
      const m = fakeCjs('/a.js');
      r.setCjs('/a.js', m);
      expect(r.hasCjs('/a.js')).toBe(true);
      expect(r.getCjs('/a.js')).toBe(m);
    });

    test('reads/writes go to the isolated overlay during isolation', () => {
      const r = new ModuleRegistries();
      const main = fakeCjs('/a.js');
      r.setCjs('/a.js', main);

      r.enterIsolated('isolateModules');
      // Isolated overlay starts empty
      expect(r.hasCjs('/a.js')).toBe(false);

      const isolated = fakeCjs('/a.js');
      r.setCjs('/a.js', isolated);
      expect(r.getCjs('/a.js')).toBe(isolated);

      r.exitIsolated();
      // Main map preserved
      expect(r.getCjs('/a.js')).toBe(main);
    });

    test('internal CJS bypasses isolation', () => {
      const r = new ModuleRegistries();
      const m = fakeCjs('/a.js');
      r.setInternalCjs('/a.js', m);

      r.enterIsolated('isolateModules');
      expect(r.hasInternalCjs('/a.js')).toBe(true);
      expect(r.getInternalCjs('/a.js')).toBe(m);
    });
  });

  describe('isolation lifecycle', () => {
    test('throws on nested entry with caller-specific message', () => {
      const r = new ModuleRegistries();
      r.enterIsolated('isolateModules');
      expect(() => r.enterIsolated('isolateModulesAsync')).toThrow(
        'isolateModulesAsync cannot be nested inside another isolateModulesAsync or isolateModules.',
      );
    });

    test('exitIsolated clears + nulls overlay maps', () => {
      const r = new ModuleRegistries();
      r.enterIsolated('isolateModules');
      r.setCjs('/a.js', fakeCjs('/a.js'));
      r.setMock('id', 'mock');

      expect(r.isIsolated()).toBe(true);
      r.exitIsolated();
      expect(r.isIsolated()).toBe(false);
      expect(r.hasCjs('/a.js')).toBe(false);
      expect(r.hasMock('id')).toBe(false);
    });
  });

  describe('withScratchRegistries', () => {
    test('runs fn against fresh CJS + mock maps and restores originals', () => {
      const r = new ModuleRegistries();
      const orig = fakeCjs('/a.js');
      r.setCjs('/a.js', orig);
      r.setMock('id', 'orig-mock');

      const result = r.withScratchRegistries(() => {
        // Inside scratch: no CJS / no mock
        expect(r.hasCjs('/a.js')).toBe(false);
        expect(r.hasMock('id')).toBe(false);
        r.setCjs('/scratch.js', fakeCjs('/scratch.js'));
        r.setMock('scratch-id', 'scratch-mock');
        return 'done';
      });

      expect(result).toBe('done');
      // Originals restored
      expect(r.getCjs('/a.js')).toBe(orig);
      expect(r.getMock('id')).toBe('orig-mock');
      // Scratch contents discarded
      expect(r.hasCjs('/scratch.js')).toBe(false);
      expect(r.hasMock('scratch-id')).toBe(false);
    });

    test('restores originals even when fn throws', () => {
      const r = new ModuleRegistries();
      const orig = fakeCjs('/a.js');
      r.setCjs('/a.js', orig);

      expect(() =>
        r.withScratchRegistries(() => {
          throw new Error('boom');
        }),
      ).toThrow('boom');
      expect(r.getCjs('/a.js')).toBe(orig);
    });
  });

  describe('require.cache Proxy', () => {
    test('exposes CJS modules and live ESM entries; hides Promise / unlinked', () => {
      const r = new ModuleRegistries();
      const cjs = fakeCjs('/cjs.js');
      r.setCjs('/cjs.js', cjs);

      const liveEsm = fakeEsm('evaluated');
      r.setEsm('/live.mjs', liveEsm as JestModule);

      const unlinkedEsm = fakeEsm('unlinked');
      r.setEsm('/unlinked.mjs', unlinkedEsm as JestModule);

      const pending = Promise.resolve(fakeEsm()) as unknown as JestModule;
      r.setEsm('/pending.mjs', pending);

      const cache = r.createRequireCacheProxy();

      // CJS reads through directly
      expect(cache['/cjs.js']).toBe(cjs);
      expect('/cjs.js' in cache).toBe(true);

      // Live ESM is wrapped
      const wrapped = cache['/live.mjs'];
      expect(wrapped).toBeDefined();
      expect(wrapped?.exports).toEqual({foo: 'bar'});
      expect(wrapped?.filename).toBe('/live.mjs');
      expect('/live.mjs' in cache).toBe(true);

      // Unlinked / pending hidden
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

    test('mutators no-op (return true)', () => {
      const r = new ModuleRegistries();
      const cache = r.createRequireCacheProxy();
      // These should silently no-op rather than throw.
      // @ts-expect-error: write-through is intentionally not supported
      cache['/x.js'] = fakeCjs('/x.js');
      expect(cache['/x.js']).toBeUndefined();
      expect(delete cache['/x.js']).toBe(true);
    });

    test('wrapEsmForRequireCache caches the wrapper per VMModule', () => {
      const r = new ModuleRegistries();
      const esm = fakeEsm('evaluated');
      const w1 = r.wrapEsmForRequireCache('/x.mjs', esm);
      const w2 = r.wrapEsmForRequireCache('/x.mjs', esm);
      expect(w1).toBe(w2);
    });
  });

  describe('clear semantics', () => {
    test('clearForReset drops everything except internal CJS', () => {
      const r = new ModuleRegistries();
      r.setCjs('/a.js', fakeCjs('/a.js'));
      r.setEsm('/b.mjs', fakeEsm() as JestModule);
      r.setMock('id', 'm');
      r.setModuleMock('mid', fakeEsm() as JestModule);
      r.setInternalCjs('/i.js', fakeCjs('/i.js'));

      r.clearForReset();
      expect(r.hasCjs('/a.js')).toBe(false);
      expect(r.hasEsm('/b.mjs')).toBe(false);
      expect(r.hasMock('id')).toBe(false);
      expect(r.hasModuleMock('mid')).toBe(false);
      expect(r.hasInternalCjs('/i.js')).toBe(true);
    });

    test('clear drops everything including internal CJS', () => {
      const r = new ModuleRegistries();
      r.setInternalCjs('/i.js', fakeCjs('/i.js'));
      r.clear();
      expect(r.hasInternalCjs('/i.js')).toBe(false);
    });
  });
});
