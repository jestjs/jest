/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Tester, equals} from '@jest/expect-utils';
import jestExpect from '../';

// Test test file demonstrates and tests the capability of recursive custom
// testers that call `equals` within their tester logic. These testers should
// receive the array of custom testers and be able to pass it into equals

const CONNECTION_PROP = '__connection';
type DbConnection = number;
let DbConnectionId = 0;

class Author {
  public name: string;
  public [CONNECTION_PROP]: DbConnection;

  constructor(name: string) {
    this.name = name;
    this[CONNECTION_PROP] = DbConnectionId++;
  }
}

class Book {
  public name: string;
  public authors: Array<Author>;
  public [CONNECTION_PROP]: DbConnection;

  constructor(name: string, authors: Array<Author>) {
    this.name = name;
    this.authors = authors;
    this[CONNECTION_PROP] = DbConnectionId++;
  }
}

const areAuthorsEqual: Tester = (a: unknown, b: unknown) => {
  const isAAuthor = a instanceof Author;
  const isBAuthor = b instanceof Author;

  if (isAAuthor && isBAuthor) {
    return a.name === b.name;
  } else if (isAAuthor !== isBAuthor) {
    return false;
  } else {
    return undefined;
  }
};

const areBooksEqual: Tester = function (
  a: unknown,
  b: unknown,
  customTesters: Array<Tester>,
) {
  const isABook = a instanceof Book;
  const isBBook = b instanceof Book;

  if (isABook && isBBook) {
    return (
      a.name === b.name && this.equals(a.authors, b.authors, customTesters)
    );
  } else if (isABook !== isBBook) {
    return false;
  } else {
    return undefined;
  }
};

function* toIterator<T>(array: Array<T>): Iterator<T> {
  for (const obj of array) {
    yield obj;
  }
}

declare module '../types' {
  interface Matchers<R> {
    toEqualBook(expected: Book): R;
  }
}

jestExpect.extend({
  toEqualBook(expected: Book, actual: Book) {
    const result = this.equals(expected, actual, this.customTesters);

    return {
      message: () =>
        `Expected Book object: ${expected.name}. Actual Book object: ${actual.name}`,
      pass: result,
    };
  },
});

// Create books with the same name and authors for use in tests. Without the
// custom tester, these books would not be equal because their DbConnections
// would have different values. However, with our custom tester they are equal.
const book1 = new Book('Book 1', [
  new Author('Author 1'),
  new Author('Author 2'),
]);
const book1b = new Book('Book 1', [
  new Author('Author 1'),
  new Author('Author 2'),
]);

const bookArg1a = new Book('Book Arg 1', [
  new Author('Author Arg 1'),
  new Author('Author Arg 2'),
]);
const bookArg1b = new Book('Book Arg 1', [
  new Author('Author Arg 1'),
  new Author('Author Arg 2'),
]);
const bookArg2a = new Book('Book Arg 2', [
  new Author('Author Arg 3'),
  new Author('Author Arg 4'),
]);
const bookArg2b = new Book('Book Arg 2', [
  new Author('Author Arg 3'),
  new Author('Author Arg 4'),
]);

const bookReturn1a = new Book('Book Return 1', [
  new Author('Author Return 1'),
  new Author('Author Return 2'),
]);
const bookReturn1b = new Book('Book Return 1', [
  new Author('Author Return 1'),
  new Author('Author Return 2'),
]);

const testArgs = [bookArg1a, bookArg1b, [bookArg2a, bookArg2b]];
// Swap the order of args to assert custom tester works correctly and ignores
// DbConnection differences
const expectedArgs = [bookArg1b, bookArg1a, [bookArg2b, bookArg2a]];

expect.addEqualityTesters([areAuthorsEqual, areBooksEqual]);

describe('with custom equality testers', () => {
  it('exposes an equality function to custom testers', () => {
    const runTestSymbol = Symbol('run this test');

    // jestExpect and expect share the same global state
    expect.assertions(3);
    jestExpect.addEqualityTesters([
      function dummyTester(a) {
        // Equality testers are globally added. Only run this assertion for this test
        if (a === runTestSymbol) {
          expect(this.equals).toBe(equals);
          return true;
        }

        return undefined;
      },
    ]);

    expect(() =>
      jestExpect(runTestSymbol).toEqual(runTestSymbol),
    ).not.toThrow();
  });

  it('basic matchers customTesters do not apply to still do not pass different Book objects', () => {
    expect(book1).not.toBe(book1b);
    expect([book1]).not.toContain(book1b);
  });

  it('basic matchers pass different Book objects', () => {
    expect(book1).toEqual(book1);
    expect(book1).toEqual(book1b);
    expect([book1, book1b]).toEqual([book1b, book1]);
    expect(new Map([['key', book1]])).toEqual(new Map([['key', book1b]]));
    expect(new Set([book1])).toEqual(new Set([book1b]));
    expect(toIterator([book1, book1b])).toEqual(toIterator([book1b, book1]));
    expect([book1]).toContainEqual(book1b);
    expect({a: book1}).toHaveProperty('a', book1b);
    expect({a: book1, b: undefined}).toStrictEqual({
      a: book1b,
      b: undefined,
    });
    expect({a: 1, b: {c: book1}}).toMatchObject({
      a: 1,
      b: {c: book1b},
    });
  });

  it('asymmetric matchers pass different Book objects', () => {
    expect([book1]).toEqual(expect.arrayContaining([book1b]));
    expect({a: 1, b: {c: book1}}).toEqual(
      expect.objectContaining({b: {c: book1b}}),
    );
  });

  it('spy matchers pass different Book objects', () => {
    const mockFn = jest.fn<(...args: Array<unknown>) => unknown>(
      () => bookReturn1a,
    );
    mockFn(...testArgs);

    expect(mockFn).toHaveBeenCalledWith(...expectedArgs);
    expect(mockFn).toHaveBeenLastCalledWith(...expectedArgs);
    expect(mockFn).toHaveBeenNthCalledWith(1, ...expectedArgs);

    expect(mockFn).toHaveReturnedWith(bookReturn1b);
    expect(mockFn).toHaveLastReturnedWith(bookReturn1b);
    expect(mockFn).toHaveNthReturnedWith(1, bookReturn1b);
  });

  it('custom matchers pass different Book objects', () => {
    expect(book1).toEqualBook(book1b);
  });

  it('toBe recommends toStrictEqual even with different Book objects', () => {
    expect(() => expect(book1).toBe(book1b)).toThrow('toStrictEqual');
  });

  it('toBe recommends toEqual even with different Book objects', () => {
    expect(() => expect({a: undefined, b: book1}).toBe({b: book1b})).toThrow(
      'toEqual',
    );
  });

  it('toContains recommends toContainEquals even with different Book objects', () => {
    expect(() => expect([book1]).toContain(book1b)).toThrow('toContainEqual');
  });

  it('toMatchObject error shows Book objects as equal', () => {
    expect(() =>
      expect({a: 1, b: book1}).toMatchObject({a: 2, b: book1b}),
    ).toThrowErrorMatchingSnapshot();
  });

  it('iterableEquality still properly detects cycles', () => {
    const a = new Set();
    a.add(book1);
    a.add(a);

    const b = new Set();
    b.add(book1b);
    b.add(b);

    expect(a).toEqual(b);
  });
});
