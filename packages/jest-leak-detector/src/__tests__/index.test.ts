/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import LeakDetector from '../index';

const gc = globalThis.gc;

// Some tests override the "gc" value. Let's make sure we roll it back to its
// previous value after executing the test.
afterEach(() => {
  globalThis.gc = gc;
});

it('complains if the value is a primitive', () => {
  expect(() => new LeakDetector(undefined)).toThrowErrorMatchingSnapshot();
  expect(() => new LeakDetector(null)).toThrowErrorMatchingSnapshot();
  expect(() => new LeakDetector(false)).toThrowErrorMatchingSnapshot();
  expect(() => new LeakDetector(42)).toThrowErrorMatchingSnapshot();
  expect(() => new LeakDetector('foo')).toThrowErrorMatchingSnapshot();
  expect(() => new LeakDetector(Symbol())).toThrowErrorMatchingSnapshot();
  expect(() => new LeakDetector(Symbol('foo'))).toThrowErrorMatchingSnapshot();
  expect(() => new LeakDetector(NaN)).toThrowErrorMatchingSnapshot();
});

it('does not show the GC if hidden', async () => {
  const detector = new LeakDetector({});

  // @ts-expect-error: purposefully removed
  globalThis.gc = undefined;
  await detector.isLeaking();
  expect(globalThis.gc).toBeUndefined();
});

it('does not hide the GC if visible', async () => {
  const detector = new LeakDetector({});

  globalThis.gc = () => {};
  await detector.isLeaking();
  expect(globalThis.gc).toBeDefined();
});

it('correctly checks simple leaks', async () => {
  let reference: unknown = {};
  let isLeaking: boolean;

  const detector = new LeakDetector(reference);

  // Reference is still held in memory.
  isLeaking = await detector.isLeaking();
  expect(isLeaking).toBe(true);

  // We destroy the only reference to the object we had.
  reference = null;

  // Reference should be gone.
  isLeaking = await detector.isLeaking();
  expect(isLeaking).toBe(false);
});

it('tests different objects', async () => {
  const refs = [
    function () {},
    () => {},
    Object.create(null),
    [],
    /foo/g,
    new Date(1234),
    {},
  ];

  const detectors = refs.map(ref => new LeakDetector(ref));

  let isLeaking: boolean;
  for (const i in detectors) {
    isLeaking = await detectors[i].isLeaking();
    expect(isLeaking).toBe(true);
    refs[i] = null;
  }

  for (const i in detectors) {
    isLeaking = await detectors[i].isLeaking();
    expect(isLeaking).toBe(false);
  }
});

it('correctly checks more complex leaks', async () => {
  let ref1: any = {};
  let ref2: any = {};

  // Create a circular dependency between ref1 and ref2.
  ref1.ref2 = ref2;
  ref2.ref1 = ref1;

  const detector1 = new LeakDetector(ref1);
  const detector2 = new LeakDetector(ref2);

  let isLeaking1: boolean;
  let isLeaking2: boolean;

  // References are still held in memory.
  isLeaking1 = await detector1.isLeaking();
  expect(isLeaking1).toBe(true);
  isLeaking2 = await detector2.isLeaking();
  expect(isLeaking2).toBe(true);

  // We destroy the reference to ref1.
  ref1 = null;

  // It will still be referenced by ref2, so both references are still leaking.
  isLeaking1 = await detector1.isLeaking();
  expect(isLeaking1).toBe(true);
  isLeaking2 = await detector2.isLeaking();
  expect(isLeaking2).toBe(true);

  // We destroy the reference to ref2.
  ref2 = null;

  // Now both references should be gone (yay mark & sweep!).
  isLeaking1 = await detector1.isLeaking();
  expect(isLeaking1).toBe(false);
  isLeaking2 = await detector2.isLeaking();
  expect(isLeaking2).toBe(false);
});
