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

['toThrowError', 'toThrow'].forEach(toThrow => {
  describe('.' + toThrow + '()', () => {

    class Err extends Error {}
    class Err2 extends Error {}

    test('to throw or not to throw', () => {
      jestExpect(() => { throw new Error('apple'); })[toThrow]();
      jestExpect(() => {}).not[toThrow]();
    });

    describe('strings', () => {
      it('passes', () => {
        jestExpect(() => { throw new Error('apple'); })[toThrow]('apple');
        jestExpect(() => { throw new Error('banana'); })
          .not[toThrow]('apple');
        jestExpect(() => {}).not[toThrow]('apple');
      });

      test('did not throw at all', () => {
        matchErrorSnapshot(() => jestExpect(() => {})[toThrow]('apple'));
      });

      test('threw, but message did not match', () => {
        matchErrorSnapshot(() =>
          jestExpect(() => { throw new Error('apple'); })
            [toThrow]('banana'),
        );
      });

      it('properly escapes strings when matching against errors', () => {
        jestExpect(() => { throw new TypeError('"this"? throws.'); })
          [toThrow]('"this"? throws.');
      });

      test('threw, but should not have', () => {
        matchErrorSnapshot(() => {
          jestExpect(() => { throw new Error('apple'); })
            .not[toThrow]('apple');
        });
      });
    });

    describe('regexp', () => {
      it('passes', () => {
        expect(() => { throw new Error('apple'); })[toThrow](/apple/);
        expect(() => { throw new Error('banana'); }).not[toThrow](/apple/);
        expect(() => {}).not[toThrow](/apple/);
      });

      test('did not throw at all', () => {
        matchErrorSnapshot(() => jestExpect(() => {})[toThrow](/apple/));
      });

      test('threw, but message did not match', () => {
        matchErrorSnapshot(() => {
          jestExpect(() => { throw new Error('apple'); })
            [toThrow](/banana/);
        });
      });

      test('threw, but should not have', () => {
        matchErrorSnapshot(() => {
          jestExpect(() => { throw new Error('apple'); })
            .not[toThrow](/apple/);
        });
      });
    });

    describe('errors', () => {
      it('works', () => {
        it('passes', () => {
          jestExpect(() => { throw new Err(); })[toThrow](new Err());
          jestExpect(() => { throw new Err('Message'); })
            [toThrow](new Err('Message'));
          jestExpect(() => { throw new Err(); })[toThrow](new Error());
          jestExpect(() => { throw new Err(); }).not[toThrow](new Err2());
          jestExpect(() => {}).not[toThrow](new Err());
        });
      });
    });

    describe('error class', () => {
      it('passes', () => {
        jestExpect(() => { throw new Err(); })[toThrow](Err);
        jestExpect(() => { throw new Err(); })[toThrow](Error);
        jestExpect(() => { throw new Err(); }).not[toThrow](Err2);
        jestExpect(() => {}).not[toThrow](Err);
      });

      test('did not throw at all', () => {
        matchErrorSnapshot(() => expect(() => {})[toThrow](Err));
      });

      test('threw, but class did not match', () => {
        matchErrorSnapshot(() => {
          jestExpect(() => { throw new Err('apple'); })[toThrow](Err2);
        });
      });

      test('threw, but should not have', () => {
        matchErrorSnapshot(() => {
          jestExpect(() => { throw new Err('apple'); }).not[toThrow](Err);
        });
      });
    });

    test('invalid arguments', () => {
      matchErrorSnapshot(() => jestExpect(() => {})[toThrow](111));
    });
  });

});
