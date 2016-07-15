/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

'use strict';

describe('.toThrowError()', () => {
  describe('strings', () => {
    it('passes', () => {
      expect(() => { throw new Error('apple'); }).toThrowError('apple');
      expect(() => { throw new Error('banana'); }).not.toThrowError('apple');
      expect(() => {}).not.toThrowError('apple');
    });

    test('did not throw at all', () => {
      let error;
      try {
        expect(() => {}).toThrowError('apple');
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toMatchSnapshot();
    });

    test('threw, but message did not match', () => {
      let error;
      try {
        expect(() => { throw new Error('apple'); }).toThrowError('banana');
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toMatchSnapshot();
    });

    test('threw, but should not have', () => {
      let error;
      try {
        expect(() => { throw new Error('apple'); }).not.toThrowError('apple');
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toMatchSnapshot();
    });
  });

  describe('regexp', () => {
    it('passes', () => {
      expect(() => { throw new Error('apple'); }).toThrowError(/apple/);
      expect(() => { throw new Error('banana'); }).not.toThrowError(/apple/);
      expect(() => {}).not.toThrowError(/apple/);
    });

    test('did not throw at all', () => {
      let error;
      try {
        expect(() => {}).toThrowError(/apple/);
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toMatchSnapshot();
    });

    test('threw, but message did not match', () => {
      let error;
      try {
        expect(() => { throw new Error('apple'); }).toThrowError(/banana/);
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toMatchSnapshot();
    });

    test('threw, but should not have', () => {
      let error;
      try {
        expect(() => { throw new Error('apple'); }).not.toThrowError(/apple/);
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toMatchSnapshot();
    });
  });

  describe('error class', () => {
    class Err extends Error {}
    class Err2 extends Error {}

    it('passes', () => {
      expect(() => { throw new Err(); }).toThrowError(Err);
      expect(() => { throw new Err(); }).toThrowError(Error);
      expect(() => { throw new Err(); }).not.toThrowError(Err2);
      expect(() => {}).not.toThrowError(Err);
    });

    test('did not throw at all', () => {
      let error;
      try {
        expect(() => {}).toThrowError(Err);
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toMatchSnapshot();
    });

    test('threw, but class did not match', () => {
      let error;
      try {
        expect(() => { throw new Err('apple'); }).toThrowError(Err2);
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toMatchSnapshot();
    });

    test('threw, but should not have', () => {
      let error;
      try {
        expect(() => { throw new Err('apple'); }).not.toThrowError(Err);
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toMatchSnapshot();
    });
  });
});
