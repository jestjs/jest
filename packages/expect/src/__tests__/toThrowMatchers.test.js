/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const jestExpect = require('../');

// Custom Error class because node versions have different stack trace strings.
class customError extends Error {
  constructor(message) {
    super();
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
    class Err extends customError {}
    class Err2 extends customError {}

    test('to throw or not to throw', () => {
      jestExpect(() => {
        throw new customError('apple');
      })[toThrow]();
      jestExpect(() => {}).not[toThrow]();
    });

    describe('strings', () => {
      it('passes', () => {
        jestExpect(() => {
          throw new customError('apple');
        })[toThrow]('apple');
        jestExpect(() => {
          throw new customError('banana');
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
            throw new customError('apple');
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
            throw new customError('apple');
          }).not[toThrow]('apple');
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('regexp', () => {
      it('passes', () => {
        expect(() => {
          throw new customError('apple');
        })[toThrow](/apple/);
        expect(() => {
          throw new customError('banana');
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
            throw new customError('apple');
          })[toThrow](/banana/);
        }).toThrowErrorMatchingSnapshot();
      });

      test('threw, but should not have', () => {
        expect(() => {
          jestExpect(() => {
            throw new customError('apple');
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
        })[toThrow](customError);
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

    describe('promise/async throws if Error-like object is returned', () => {
      const asyncFn = async (shouldThrow?: boolean, resolve?: boolean) => {
        let err;
        if (shouldThrow) {
          err = new Err('async apple');
        }
        if (resolve) {
          return await Promise.resolve(err || 'apple');
        } else {
          return await Promise.reject(err || 'apple');
        }
      };

      test('passes', async () => {
        expect.assertions(24);
        await jestExpect(Promise.reject(new Error())).rejects[toThrow]();

        await jestExpect(asyncFn(true)).rejects[toThrow]();
        await jestExpect(asyncFn(true)).rejects[toThrow](Err);
        await jestExpect(asyncFn(true)).rejects[toThrow](Error);
        await jestExpect(asyncFn(true)).rejects[toThrow]('apple');
        await jestExpect(asyncFn(true)).rejects[toThrow](/app/);

        await jestExpect(asyncFn(true)).rejects.not[toThrow](Err2);
        await jestExpect(asyncFn(true)).rejects.not[toThrow]('banana');
        await jestExpect(asyncFn(true)).rejects.not[toThrow](/banana/);

        await jestExpect(asyncFn(true, true)).resolves[toThrow]();

        await jestExpect(asyncFn(false, true)).resolves.not[toThrow]();
        await jestExpect(asyncFn(false, true)).resolves.not[toThrow](Error);
        await jestExpect(asyncFn(false, true)).resolves.not[toThrow]('apple');
        await jestExpect(asyncFn(false, true)).resolves.not[toThrow](/apple/);
        await jestExpect(asyncFn(false, true)).resolves.not[toThrow]('banana');
        await jestExpect(asyncFn(false, true)).resolves.not[toThrow](/banana/);

        await jestExpect(asyncFn()).rejects.not[toThrow]();
        await jestExpect(asyncFn()).rejects.not[toThrow](Error);
        await jestExpect(asyncFn()).rejects.not[toThrow]('apple');
        await jestExpect(asyncFn()).rejects.not[toThrow](/apple/);
        await jestExpect(asyncFn()).rejects.not[toThrow]('banana');
        await jestExpect(asyncFn()).rejects.not[toThrow](/banana/);

        // Works with nested functions inside promises
        await jestExpect(
          Promise.reject(() => {
            throw new Error();
          }),
        ).rejects[toThrow]();
        await jestExpect(Promise.reject(() => {})).rejects.not[toThrow]();
      });

      test('did not throw at all', async () => {
        let err;
        try {
          await jestExpect(asyncFn()).rejects.toThrow();
        } catch (error) {
          err = error;
        }
        expect(err).toMatchSnapshot();
      });

      test('threw, but class did not match', async () => {
        let err;
        try {
          await jestExpect(asyncFn(true)).rejects.toThrow(Err2);
        } catch (error) {
          err = error;
        }
        expect(err).toMatchSnapshot();
      });

      test('threw, but should not have', async () => {
        let err;
        try {
          await jestExpect(asyncFn(true)).rejects.not.toThrow();
        } catch (error) {
          err = error;
        }
        expect(err).toMatchSnapshot();
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
