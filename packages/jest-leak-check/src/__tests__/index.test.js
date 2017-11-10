'use strict';

import LeakCheck from '../index';

it('complains if the value is a primitive', () => {
  expect(() => new LeakCheck(undefined)).toThrow(TypeError);
  expect(() => new LeakCheck(null)).toThrow(TypeError);
  expect(() => new LeakCheck(false)).toThrow(TypeError);
  expect(() => new LeakCheck(42)).toThrow(TypeError);
  expect(() => new LeakCheck('foo')).toThrow(TypeError);
});

it('correctly checks simple leaks', () => {
  let reference = {};

  const check = new LeakCheck(reference);

  // Reference is still held in memory.
  expect(check.isLeaked()).toBe(true);

  // We destroy the only reference to the object we had.
  reference = null;

  // Reference should be gone.
  expect(check.isLeaked()).toBe(false);
});

it('tests different objects', () => {
  const refs = [
    function() {},
    () => {},
    Object.create(null),
    [],
    /foo/g,
    new Date(1234),
  ];

  const checks = refs.map(ref => new LeakCheck(ref));

  checks.forEach(check => expect(check.isLeaked()).toBe(true));
  refs.forEach((_, i) => (refs[i] = null));
  checks.forEach(check => expect(check.isLeaked()).toBe(false));
});

it('correctly checks more complex leaks', () => {
  let ref1 = {};
  let ref2 = {};

  // Create a circular dependency between ref1 and ref2.
  ref1.ref2 = ref2;
  ref2.ref1 = ref1;

  const check1 = new LeakCheck(ref1);
  const check2 = new LeakCheck(ref2);

  // References are still held in memory.
  expect(check1.isLeaked()).toBe(true);
  expect(check2.isLeaked()).toBe(true);

  // We destroy the reference to ref1.
  ref1 = null;

  // It will still be referenced by ref2, so both references are still leaking.
  expect(check1.isLeaked()).toBe(true);
  expect(check2.isLeaked()).toBe(true);

  // We destroy the reference to ref2.
  ref2 = null;

  // Now both references should be gone (yay mark & sweep!).
  expect(check1.isLeaked()).toBe(false);
  expect(check2.isLeaked()).toBe(false);
});
