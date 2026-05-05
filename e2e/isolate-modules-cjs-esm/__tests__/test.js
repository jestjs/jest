/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {createRequire} from 'node:module';
import {jest} from '@jest/globals';

const require = createRequire(import.meta.url);

test('require + await import of the same .cjs inside isolation keep distinct shapes', async () => {
  await jest.isolateModulesAsync(async () => {
    const cjsBefore = require('../module.cjs');
    expect(cjsBefore).toEqual({kind: 'cjs', value: 'cjs-shape'});

    const esm = await import('../module.cjs');
    // ESM-side default unwrap exposes the CJS module.exports as the default.
    expect(esm.default).toEqual({kind: 'cjs', value: 'cjs-shape'});

    // Re-require from the CJS slot. If the ESM write into the shared
    // isolation overlay had clobbered the CJS slot, this would return the ESM
    // namespace (or its synthetic wrapper) instead of the original CJS exports.
    const cjsAfter = require('../module.cjs');
    expect(cjsAfter).toBe(cjsBefore);
    expect(cjsAfter).toEqual({kind: 'cjs', value: 'cjs-shape'});
    expect(cjsAfter).not.toBe(esm);
    // `esm` itself is the ESM namespace object, distinct from the CJS exports.
    expect(esm).not.toBe(cjsBefore);
    expect(esm[Symbol.toStringTag]).toBe('Module');
  });
});
