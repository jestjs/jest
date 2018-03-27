/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const Immutable = require('immutable');
const jestExpect = require('../');

['toBeCalled', 'toHaveBeenCalled'].forEach(called => {
  describe(`${called}`, () => {
    test(`works only on spies or jest.fn`, () => {
      const fn = function fn() {};

      expect(() => jestExpect(fn)[called]()).toThrowErrorMatchingSnapshot();
    });

    test(`passes when called`, () => {
      const fn = jest.fn();
      fn();
      jestExpect(fn)[called]();
      expect(() => jestExpect(fn).not[called]()).toThrowErrorMatchingSnapshot();
    });

    test(`.not passes when called`, () => {
      const fn = jest.fn();

      jestExpect(fn).not[called]();
      expect(() => jestExpect(fn)[called]()).toThrowErrorMatchingSnapshot();
    });

    test(`fails with any argument passed`, () => {
      const fn = jest.fn();

      fn();
      expect(() => jestExpect(fn)[called](555)).toThrowErrorMatchingSnapshot();
    });

    test(`.not fails with any argument passed`, () => {
      const fn = jest.fn();

      expect(() =>
        jestExpect(fn).not[called](555),
      ).toThrowErrorMatchingSnapshot();
    });
  });
});

['toBeCalledTimes', 'toHaveBeenCalledTimes'].forEach(calledTimes => {
  describe(`${calledTimes}`, () => {
    test('works only on spies or jest.fn', () => {
      const fn = function fn() {};

      expect(() =>
        jestExpect(fn)[calledTimes](2),
      ).toThrowErrorMatchingSnapshot();
    });

    test('only accepts a number argument', () => {
      const fn = jest.fn();
      fn();
      jestExpect(fn)[calledTimes](1);

      [{}, [], true, 'a', new Map(), () => {}].forEach(value => {
        expect(() =>
          jestExpect(fn)[calledTimes](value),
        ).toThrowErrorMatchingSnapshot();
      });
    });

    test('.not only accepts a number argument', () => {
      const fn = jest.fn();
      jestExpect(fn).not[calledTimes](1);

      [{}, [], true, 'a', new Map(), () => {}].forEach(value => {
        expect(() =>
          jestExpect(fn).not[calledTimes](value),
        ).toThrowErrorMatchingSnapshot();
      });
    });

    test('passes if function called equal to expected times', () => {
      const fn = jest.fn();
      fn();
      fn();

      jestExpect(fn)[calledTimes](2);

      expect(() =>
        jestExpect(fn).not[calledTimes](2),
      ).toThrowErrorMatchingSnapshot();
    });

    test('.not passes if function called more than expected times', () => {
      const fn = jest.fn();
      fn();
      fn();
      fn();

      jestExpect(fn)[calledTimes](3);
      jestExpect(fn).not[calledTimes](2);

      expect(() =>
        jestExpect(fn)[calledTimes](2),
      ).toThrowErrorMatchingSnapshot();
    });

    test('.not passes if function called less than expected times', () => {
      const fn = jest.fn();
      fn();

      jestExpect(fn)[calledTimes](1);
      jestExpect(fn).not[calledTimes](2);

      expect(() =>
        jestExpect(fn)[calledTimes](2),
      ).toThrowErrorMatchingSnapshot();
    });
  });
});

[
  'lastCalledWith',
  'toHaveBeenLastCalledWith',
  'nthCalledWith',
  'toHaveBeenNthCalledWith',
  'toBeCalledWith',
  'toHaveBeenCalledWith',
].forEach(calledWith => {
  const caller = function(callee, ...args) {
    if (
      calledWith === 'nthCalledWith' ||
      calledWith === 'toHaveBeenNthCalledWith'
    ) {
      callee(1, ...args);
    } else {
      callee(...args);
    }
  };
  describe(`${calledWith}`, () => {
    test(`works only on spies or jest.fn`, () => {
      const fn = function fn() {};

      expect(() => jestExpect(fn)[calledWith]()).toThrowErrorMatchingSnapshot();
    });

    test(`works when not called`, () => {
      const fn = jest.fn();
      caller(jestExpect(fn).not[calledWith], 'foo', 'bar');

      expect(() =>
        caller(jestExpect(fn)[calledWith], 'foo', 'bar'),
      ).toThrowErrorMatchingSnapshot();
    });

    test(`works with no arguments`, () => {
      const fn = jest.fn();
      fn();
      caller(jestExpect(fn)[calledWith]);
    });

    test(`works with arguments that don't match`, () => {
      const fn = jest.fn();
      fn('foo', 'bar1');

      caller(jestExpect(fn).not[calledWith], 'foo', 'bar');

      expect(() =>
        caller(jestExpect(fn)[calledWith], 'foo', 'bar'),
      ).toThrowErrorMatchingSnapshot();
    });

    test(`works with arguments that match`, () => {
      const fn = jest.fn();
      fn('foo', 'bar');

      caller(jestExpect(fn)[calledWith], 'foo', 'bar');

      expect(() =>
        caller(jestExpect(fn).not[calledWith], 'foo', 'bar'),
      ).toThrowErrorMatchingSnapshot();
    });

    test(`works with trailing undefined arguments`, () => {
      const fn = jest.fn();
      fn('foo', undefined);

      expect(() =>
        caller(jestExpect(fn)[calledWith], 'foo'),
      ).toThrowErrorMatchingSnapshot();
    });

    test(`works with Map`, () => {
      const fn = jest.fn();

      const m1 = new Map([[1, 2], [2, 1]]);
      const m2 = new Map([[1, 2], [2, 1]]);
      const m3 = new Map([['a', 'b'], ['b', 'a']]);

      fn(m1);

      caller(jestExpect(fn)[calledWith], m2);
      caller(jestExpect(fn).not[calledWith], m3);

      expect(() =>
        caller(jestExpect(fn).not[calledWith], m2),
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        caller(jestExpect(fn)[calledWith], m3),
      ).toThrowErrorMatchingSnapshot();
    });

    test(`works with Set`, () => {
      const fn = jest.fn();

      const s1 = new Set([1, 2]);
      const s2 = new Set([1, 2]);
      const s3 = new Set([3, 4]);

      fn(s1);

      caller(jestExpect(fn)[calledWith], s2);
      caller(jestExpect(fn).not[calledWith], s3);

      expect(() =>
        caller(jestExpect(fn).not[calledWith], s2),
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        caller(jestExpect(fn)[calledWith], s3),
      ).toThrowErrorMatchingSnapshot();
    });

    test(`works with Immutable.js objects`, () => {
      const fn = jest.fn();
      const directlyCreated = new Immutable.Map([['a', {b: 'c'}]]);
      const indirectlyCreated = new Immutable.Map().set('a', {b: 'c'});
      fn(directlyCreated, indirectlyCreated);

      caller(jestExpect(fn)[calledWith], indirectlyCreated, directlyCreated);

      expect(() =>
        caller(
          jestExpect(fn).not[calledWith],
          indirectlyCreated,
          directlyCreated,
        ),
      ).toThrowErrorMatchingSnapshot();
    });

    const basicCalledWith = [
      'lastCalledWith',
      'toHaveBeenLastCalledWith',
      'toBeCalledWith',
      'toHaveBeenCalledWith',
    ];

    if (basicCalledWith.indexOf(calledWith) >= 0) {
      test(`works with many arguments`, () => {
        const fn = jest.fn();
        fn('foo1', 'bar');
        fn('foo', 'bar1');
        fn('foo', 'bar');

        jestExpect(fn)[calledWith]('foo', 'bar');

        expect(() =>
          jestExpect(fn).not[calledWith]('foo', 'bar'),
        ).toThrowErrorMatchingSnapshot();
      });

      test(`works with many arguments that don't match`, () => {
        const fn = jest.fn();
        fn('foo', 'bar1');
        fn('foo', 'bar2');
        fn('foo', 'bar3');

        jestExpect(fn).not[calledWith]('foo', 'bar');

        expect(() =>
          jestExpect(fn)[calledWith]('foo', 'bar'),
        ).toThrowErrorMatchingSnapshot();
      });
    }

    const nthCalled = ['toHaveBeenNthCalledWith', 'nthCalledWith'];
    if (nthCalled.indexOf(calledWith) >= 0) {
      test(`works with three calls`, () => {
        const fn = jest.fn();
        fn('foo1', 'bar');
        fn('foo', 'bar1');
        fn('foo', 'bar');

        jestExpect(fn)[calledWith](1, 'foo1', 'bar');
        jestExpect(fn)[calledWith](2, 'foo', 'bar1');
        jestExpect(fn)[calledWith](3, 'foo', 'bar');

        expect(() => {
          jestExpect(fn).not[calledWith](1, 'foo1', 'bar');
          jestExpect(fn).not[calledWith](2, 'foo', 'bar1');
          jestExpect(fn).not[calledWith](3, 'foo', 'bar');
        }).toThrowErrorMatchingSnapshot();
      });

      test('should replace 1st, 2nd, 3rd with first, second, third', async () => {
        const fn = jest.fn();
        fn('foo1', 'bar');
        fn('foo', 'bar1');
        fn('foo', 'bar');

        expect(() => {
          jestExpect(fn)[calledWith](1, 'foo', 'bar');
          jestExpect(fn)[calledWith](2, 'foo', 'bar');
          jestExpect(fn)[calledWith](3, 'foo1', 'bar');
        }).toThrowErrorMatchingSnapshot();

        expect(() => {
          jestExpect(fn).not[calledWith](1, 'foo1', 'bar');
          jestExpect(fn).not[calledWith](2, 'foo', 'bar1');
          jestExpect(fn).not[calledWith](3, 'foo', 'bar');
        }).toThrowErrorMatchingSnapshot();
      });

      test('should reject nth value smaller than 1', async () => {
        const fn = jest.fn();
        fn('foo1', 'bar');

        expect(() => {
          jestExpect(fn)[calledWith](0, 'foo1', 'bar');
        }).toThrowErrorMatchingSnapshot();
      });

      test('should reject non integer nth value', async () => {
        const fn = jest.fn();
        fn('foo1', 'bar');

        expect(() => {
          jestExpect(fn)[calledWith](0.1, 'foo1', 'bar');
        }).toThrowErrorMatchingSnapshot();
      });
    }
  });
});
