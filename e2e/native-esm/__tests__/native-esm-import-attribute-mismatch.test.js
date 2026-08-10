/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// `toBeInstanceOf(TypeError)` is intentionally avoided: the validator throws
// in the runtime's realm, so `instanceof TypeError` (test realm) is false.
// `error.constructor.name` and `error.code` are the cross-realm-stable checks.

test('throws on unknown attribute key', async () => {
  const error = await import('../package.json', {
    with: {cache: 'no-store', type: 'json'},
  }).catch(error_ => error_);
  expect(error.constructor.name).toBe('TypeError');
  expect(error.code).toBe('ERR_IMPORT_ATTRIBUTE_UNSUPPORTED');
});

test('throws when JSON has wrong type', async () => {
  const error = await import('../package.json', {
    with: {type: 'css'},
  }).catch(error_ => error_);
  expect(error.constructor.name).toBe('TypeError');
  expect(error.code).toBe('ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE');
  expect(error.message).toMatch(/not of type "css"/);
});

test('throws when non-JSON has any type attribute', async () => {
  const error = await import('../index.js', {
    with: {type: 'javascript'},
  }).catch(error_ => error_);
  expect(error.constructor.name).toBe('TypeError');
  expect(error.code).toBe('ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE');
  expect(error.message).toMatch(/not of type "javascript"/);
});
