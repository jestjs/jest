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

const jestExpect = require('../').expect;
const matchErrorSnapshot = require('./_matchErrorSnapshot');

describe('.toThrowError()', () => {
  test('invalid arguments', () => {
    expect(() => {
      jestExpect(() => {}).not.toThrowError();
    }).toThrow();

    expect(() => {
      jestExpect(() => {}).not.toThrowError([]);
    }).toThrow();
  });

  describe('strings', () => {
    it('passes', () => {
      jestExpect(() => { throw new Error('apple'); }).toThrowError('apple');
      jestExpect(() => { throw new Error('banana'); })
        .not.toThrowError('apple');
      jestExpect(() => {}).not.toThrowError('apple');
    });

    test('did not throw at all', () => {
      matchErrorSnapshot(() => jestExpect(() => {}).toThrowError('apple'));
    });

    test('threw, but message did not match', () => {
      matchErrorSnapshot(() =>
        jestExpect(() => { throw new Error('apple'); }).toThrowError('banana'),
      );
    });

    it('properly escapes strings when matching against errors', () => {
      jestExpect(() => { throw new TypeError('"this"? throws.'); })
        .toThrowError('"this"? throws.');
    });

    test('threw, but should not have', () => {
      matchErrorSnapshot(() => {
        jestExpect(() => { throw new Error('apple'); })
          .not.toThrowError('apple');
      });
    });
  });

  describe('regexp', () => {
    it('passes', () => {
      expect(() => { throw new Error('apple'); }).toThrowError(/apple/);
      expect(() => { throw new Error('banana'); }).not.toThrowError(/apple/);
      expect(() => {}).not.toThrowError(/apple/);
    });

    test('did not throw at all', () => {
      matchErrorSnapshot(() => jestExpect(() => {}).toThrowError(/apple/));
    });

    test('threw, but message did not match', () => {
      matchErrorSnapshot(() => {
        jestExpect(() => { throw new Error('apple'); }).toThrowError(/banana/);
      });
    });

    test('threw, but should not have', () => {
      matchErrorSnapshot(() => {
        jestExpect(() => { throw new Error('apple'); })
          .not.toThrowError(/apple/);
      });
    });
  });

  describe('error class', () => {
    class Err extends Error {}
    class Err2 extends Error {}

    it('passes', () => {
      jestExpect(() => { throw new Err(); }).toThrowError(Err);
      jestExpect(() => { throw new Err(); }).toThrowError(Error);
      jestExpect(() => { throw new Err(); }).not.toThrowError(Err2);
      jestExpect(() => {}).not.toThrowError(Err);
    });

    test('did not throw at all', () => {
      matchErrorSnapshot(() => expect(() => {}).toThrowError(Err));
    });

    test('threw, but class did not match', () => {
      matchErrorSnapshot(() => {
        jestExpect(() => { throw new Err('apple'); }).toThrowError(Err2);
      });
    });

    test('threw, but should not have', () => {
      matchErrorSnapshot(() => {
        jestExpect(() => { throw new Err('apple'); }).not.toThrowError(Err);
      });
    });
  });

  test('invalid arguments', () => {
    matchErrorSnapshot(() => jestExpect(() => {}).toThrowError(111));
  });
});
