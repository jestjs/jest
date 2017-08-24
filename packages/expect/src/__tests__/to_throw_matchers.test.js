/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

const jestExpect = require('../');

// Custom Error class because node versions have different stack trace strings.
class Error {
  constructor(message) {
    this.message = message;
    this.name = 'Error';
    this.stack =
      'Error\n' +
      '  at jestExpect' +
      ' (packages/expect/src/__tests__/toThrowMatchers-test.js:24:74)';
  }
}

['toThrowError', 'toThrow'].forEach(toThrow => {
  describe('.' + toThrow + '()', () => {
    class Err extends Error {}
    class Err2 extends Error {}

    test('to throw or not to throw', () => {
      jestExpect(() => {
        throw new Error('apple');
      })[toThrow]();
      jestExpect(() => {}).not[toThrow]();
    });

    describe('strings', () => {
      it('passes', () => {
        jestExpect(() => {
          throw new Error('apple');
        })[toThrow]('apple');
        jestExpect(() => {
          throw new Error('banana');
        }).not[toThrow]('apple');
        jestExpect(() => {}).not[toThrow]('apple');
      });

      test('did not throw at all', () => {
        expect(() =>
          jestExpect(() => {})[toThrow]('apple'),
        ).toThrowErrorMatchingSnapshot();
      });

      test('threw, but message did not match', () => {
        expect(() => {
          jestExpect(() => {
            throw new Error('apple');
          })[toThrow]('banana');
        }).toThrowErrorMatchingSnapshot();
      });

      it('properly escapes strings when matching against errors', () => {
        jestExpect(() => {
          throw new TypeError('"this"? throws.');
        })[toThrow]('"this"? throws.');
      });

      test('threw, but should not have', () => {
        expect(() => {
          jestExpect(() => {
            throw new Error('apple');
          }).not[toThrow]('apple');
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('regexp', () => {
      it('passes', () => {
        expect(() => {
          throw new Error('apple');
        })[toThrow](/apple/);
        expect(() => {
          throw new Error('banana');
        }).not[toThrow](/apple/);
        expect(() => {}).not[toThrow](/apple/);
      });

      test('did not throw at all', () => {
        expect(() =>
          jestExpect(() => {})[toThrow](/apple/),
        ).toThrowErrorMatchingSnapshot();
      });

      test('threw, but message did not match', () => {
        expect(() => {
          jestExpect(() => {
            throw new Error('apple');
          })[toThrow](/banana/);
        }).toThrowErrorMatchingSnapshot();
      });

      test('threw, but should not have', () => {
        expect(() => {
          jestExpect(() => {
            throw new Error('apple');
          }).not[toThrow](/apple/);
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('error class', () => {
      it('passes', () => {
        jestExpect(() => {
          throw new Err();
        })[toThrow](Err);
        jestExpect(() => {
          throw new Err();
        })[toThrow](Error);
        jestExpect(() => {
          throw new Err();
        }).not[toThrow](Err2);
        jestExpect(() => {}).not[toThrow](Err);
      });

      test('did not throw at all', () => {
        expect(() =>
          expect(() => {})[toThrow](Err),
        ).toThrowErrorMatchingSnapshot();
      });

      test('threw, but class did not match', () => {
        expect(() => {
          jestExpect(() => {
            throw new Err('apple');
          })[toThrow](Err2);
        }).toThrowErrorMatchingSnapshot();
      });

      test('threw, but should not have', () => {
        expect(() => {
          jestExpect(() => {
            throw new Err('apple');
          }).not[toThrow](Err);
        }).toThrowErrorMatchingSnapshot();
      });
    });

    test('invalid arguments', () => {
      expect(() =>
        jestExpect(() => {})[toThrow](111),
      ).toThrowErrorMatchingSnapshot();
    });

    test('invalid actual', () => {
      expect(() =>
        jestExpect('a string')[toThrow](),
      ).toThrowErrorMatchingSnapshot();
    });
  });
});
