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

const TestWatcher = require('../TestWatcher');

describe('TestWatcher', () => {
  test('setState(value) sets TestWatcher state.value immediately', () => {
    const testWatcher = new TestWatcher();

    testWatcher.setState({interrupted: false});
    expect(testWatcher.state.interrupted).toBe(false);

    testWatcher.setState({test: 42});
    expect(testWatcher.state.test).toBe(42);
  });

  test('isInterrupted() check if TestWatcher is interrupted', () => {
    const testWatcher = new TestWatcher();

    testWatcher.setState({interrupted: false});
    expect(testWatcher.isInterrupted()).toBe(false);

    testWatcher.setState({interrupted: true});
    expect(testWatcher.isInterrupted()).toBe(true);
  });

  test('subscribe(callback) check if TestWatcher is interrupted', () => {
    const testWatcher = new TestWatcher();
    let testVal = 1337;
    const example = () => testVal++;

    testWatcher.subscribe(example);
    expect(testVal).toBe(1337);

    testWatcher.setState({interrupted: true});
    expect(testVal).toBe(1338);
  });

  test('unsubscribe() is returned from subscribe()', () => {
    const testWatcher = new TestWatcher();
    let testVal = 1337;
    let testVal2 = 42;
    const example = () => testVal++;
    const example2 = () => testVal2--;
    const unsubscribe = testWatcher.subscribe(example);
    const unsubscribe2 = testWatcher.subscribe(example2);

    unsubscribe();
    testWatcher.setState({interrupted: true});
    expect(testVal).toBe(1337);
    expect(testVal2).toBe(41);
    unsubscribe2();
    testWatcher.setState({interrupted: false});
    expect(testVal).toBe(1337);
    expect(testVal2).toBe(41);
  });
});
