/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {getHeapSnapshot} from 'v8';
import LeakDetector from '../index';

jest.mock('v8', () => ({
  ...(jest.requireActual('v8') as Record<string, unknown>),
  getHeapSnapshot: jest.fn(),
}));

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
  expect(() => new LeakDetector(Number.NaN)).toThrowErrorMatchingSnapshot();
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

it('generate V8 heap snapshots can be toggled on and off', async () => {
  const getHeapSnapshotSpy = jest.fn();
  getHeapSnapshot.mockImplementation(getHeapSnapshotSpy);

  const ref1: unknown = {};
  const ref2: unknown = {};
  const ref3: unknown = {};

  let detector = new LeakDetector(ref1);
  const isLeaking = await detector.isLeaking();
  expect(isLeaking).toBe(true);
  expect(getHeapSnapshotSpy).toHaveBeenCalledTimes(1);

  detector = new LeakDetector(ref2, {shouldGenerateV8HeapSnapshot: true});
  await detector.isLeaking();
  expect(getHeapSnapshotSpy).toHaveBeenCalledTimes(2);

  detector = new LeakDetector(ref3, {shouldGenerateV8HeapSnapshot: false});
  await detector.isLeaking();
  expect(getHeapSnapshotSpy).toHaveBeenCalledTimes(2);
});
