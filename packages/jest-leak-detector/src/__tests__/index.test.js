'use strict';

import LeakDetector from '../index';

it('complains if the value is a primitive', () => {
  expect(() => new LeakDetector(undefined)).toThrow(TypeError);
  expect(() => new LeakDetector(null)).toThrow(TypeError);
  expect(() => new LeakDetector(false)).toThrow(TypeError);
  expect(() => new LeakDetector(42)).toThrow(TypeError);
  expect(() => new LeakDetector('foo')).toThrow(TypeError);
});

it('correctly detectors simple leaks', () => {
  let reference = {};

  const detector = new LeakDetector(reference);

  // Reference is still held in memory.
  expect(detector.isLeaked()).toBe(true);

  // We destroy the only reference to the object we had.
  reference = null;

  // Reference should be gone.
  expect(detector.isLeaked()).toBe(false);
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

  const detectors = refs.map(ref => new LeakDetector(ref));

  detectors.forEach(detector => expect(detector.isLeaked()).toBe(true));
  refs.forEach((_, i) => (refs[i] = null));
  detectors.forEach(detector => expect(detector.isLeaked()).toBe(false));
});

it('correctly detectors more complex leaks', () => {
  let ref1 = {};
  let ref2 = {};

  // Create a circular dependency between ref1 and ref2.
  ref1.ref2 = ref2;
  ref2.ref1 = ref1;

  const detector1 = new LeakDetector(ref1);
  const detector2 = new LeakDetector(ref2);

  // References are still held in memory.
  expect(detector1.isLeaked()).toBe(true);
  expect(detector2.isLeaked()).toBe(true);

  // We destroy the reference to ref1.
  ref1 = null;

  // It will still be referenced by ref2, so both references are still leaking.
  expect(detector1.isLeaked()).toBe(true);
  expect(detector2.isLeaked()).toBe(true);

  // We destroy the reference to ref2.
  ref2 = null;

  // Now both references should be gone (yay mark & sweep!).
  expect(detector1.isLeaked()).toBe(false);
  expect(detector2.isLeaked()).toBe(false);
});
