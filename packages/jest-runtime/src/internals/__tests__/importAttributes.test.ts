/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ImportAttributeValidator} from '../importAttributes';

describe('ImportAttributeValidator', () => {
  let validator: ImportAttributeValidator;
  beforeEach(() => {
    validator = new ImportAttributeValidator();
  });

  // Distinct paths per test keep assertions and failure output unambiguous.
  let counter = 0;
  const uniquePaths = () => {
    counter += 1;
    return {
      js: `/test-${counter}.js`,
      json: `/test-${counter}.json`,
      referencer: `/referencer-${counter}.mjs`,
    };
  };

  describe('JSON modules', () => {
    test('accepts type: json', () => {
      const {json, referencer} = uniquePaths();
      expect(() =>
        validator.validate(json, {type: 'json'}, referencer),
      ).not.toThrow();
    });

    test('throws ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE when type is wrong', () => {
      const {json, referencer} = uniquePaths();
      let error: NodeJS.ErrnoException | null = null;
      try {
        validator.validate(json, {type: 'css'}, referencer);
      } catch (error_) {
        error = error_ as NodeJS.ErrnoException;
      }
      expect(error).not.toBeNull();
      expect(error).toBeInstanceOf(TypeError);
      expect(error?.code).toBe('ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE');
      expect(error?.message).toMatch(/not of type "css"/);
    });

    test('warns once per (referencer, module) when no attribute is present', () => {
      const {json, referencer} = uniquePaths();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        validator.validate(json, {}, referencer);
        validator.validate(json, {}, referencer);
        validator.validate(json, {}, referencer);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'importing JSON without an import attribute is deprecated',
          ),
        );
      } finally {
        warnSpy.mockRestore();
      }
    });

    test('warns again for a different referencer importing the same module', () => {
      const {json, referencer} = uniquePaths();
      const otherReferencer = `${referencer}-other`;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        validator.validate(json, {}, referencer);
        validator.validate(json, {}, otherReferencer);
        expect(warnSpy).toHaveBeenCalledTimes(2);
      } finally {
        warnSpy.mockRestore();
      }
    });

    test('treats data:application/json URIs as JSON modules', () => {
      const {referencer} = uniquePaths();
      const dataUri = 'data:application/json,{"x":1}';
      // type: 'json' is accepted
      expect(() =>
        validator.validate(dataUri, {type: 'json'}, referencer),
      ).not.toThrow();
      // Wrong type is rejected
      let error: NodeJS.ErrnoException | null = null;
      try {
        validator.validate(dataUri, {type: 'css'}, referencer);
      } catch (error_) {
        error = error_ as NodeJS.ErrnoException;
      }
      expect(error?.code).toBe('ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE');
    });

    test('truncates data: URI payload in the deprecation warning', () => {
      const {referencer} = uniquePaths();
      const huge = 'a'.repeat(10_000);
      const dataUri = `data:application/json,${encodeURIComponent(huge)}`;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        validator.validate(dataUri, {}, referencer);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        const message = warnSpy.mock.calls[0][0];
        expect(message).toContain('data:application/json,…');
        expect(message).not.toContain(huge);
      } finally {
        warnSpy.mockRestore();
      }
    });

    test('warning mentions both static and dynamic syntax', () => {
      const {json, referencer} = uniquePaths();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        validator.validate(json, {}, referencer);
        const message = warnSpy.mock.calls[0][0];
        expect(message).toContain("with { type: 'json' }");
        expect(message).toContain("{ with: { type: 'json' } }");
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  describe('non-JSON modules', () => {
    test('accepts no attributes', () => {
      const {js, referencer} = uniquePaths();
      expect(() => validator.validate(js, {}, referencer)).not.toThrow();
    });

    test('throws ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE when type is set', () => {
      const {js, referencer} = uniquePaths();
      let error: NodeJS.ErrnoException | null = null;
      try {
        validator.validate(js, {type: 'javascript'}, referencer);
      } catch (error_) {
        error = error_ as NodeJS.ErrnoException;
      }
      expect(error?.code).toBe('ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE');
      expect(error?.message).toMatch(/not of type "javascript"/);
    });

    test('throws when type: json is asserted on non-JSON', () => {
      const {js, referencer} = uniquePaths();
      let error: NodeJS.ErrnoException | null = null;
      try {
        validator.validate(js, {type: 'json'}, referencer);
      } catch (error_) {
        error = error_ as NodeJS.ErrnoException;
      }
      expect(error?.code).toBe('ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE');
    });
  });

  describe('unknown attribute keys', () => {
    test('throws ERR_IMPORT_ATTRIBUTE_UNSUPPORTED on a JSON module', () => {
      const {json, referencer} = uniquePaths();
      let error: NodeJS.ErrnoException | null = null;
      try {
        validator.validate(json, {cache: 'no-store', type: 'json'}, referencer);
      } catch (error_) {
        error = error_ as NodeJS.ErrnoException;
      }
      expect(error?.code).toBe('ERR_IMPORT_ATTRIBUTE_UNSUPPORTED');
      expect(error?.message).toMatch(/Import attribute "cache"/);
    });

    test('throws ERR_IMPORT_ATTRIBUTE_UNSUPPORTED on a non-JSON module', () => {
      const {js, referencer} = uniquePaths();
      let error: NodeJS.ErrnoException | null = null;
      try {
        validator.validate(js, {foo: 'bar'}, referencer);
      } catch (error_) {
        error = error_ as NodeJS.ErrnoException;
      }
      expect(error?.code).toBe('ERR_IMPORT_ATTRIBUTE_UNSUPPORTED');
    });

    test('rejects unknown key before reporting type-mismatch', () => {
      // Unknown-key check is first per Node's `validateAttributes` order.
      const {json, referencer} = uniquePaths();
      let error: NodeJS.ErrnoException | null = null;
      try {
        validator.validate(json, {nonsense: 'x', type: 'css'}, referencer);
      } catch (error_) {
        error = error_ as NodeJS.ErrnoException;
      }
      expect(error?.code).toBe('ERR_IMPORT_ATTRIBUTE_UNSUPPORTED');
    });
  });

  test('a fresh validator warns again for an already-warned pair', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      validator.validate('/pair.json', {}, '/referencer.mjs');
      new ImportAttributeValidator().validate(
        '/pair.json',
        {},
        '/referencer.mjs',
      );
      expect(warnSpy).toHaveBeenCalledTimes(2);
    } finally {
      warnSpy.mockRestore();
    }
  });
});
