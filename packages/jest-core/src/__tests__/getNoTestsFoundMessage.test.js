// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

import getNoTestsFoundMessage from '../getNoTestsFoundMessage';

describe('getNoTestsFoundMessage', () => {
  function createGlobalConfig(options) {
    return {
      rootDir: '/root/dir',
      testPathPattern: '/path/pattern',
      ...options,
    };
  }

  test('returns correct message when monitoring only failures', () => {
    const config = createGlobalConfig({onlyFailures: true});
    expect(getNoTestsFoundMessage([], config)).toMatchSnapshot();
  });

  test('returns correct message when monitoring only changed', () => {
    const config = createGlobalConfig({onlyChanged: true});
    expect(getNoTestsFoundMessage([], config)).toMatchSnapshot();
  });

  test('returns correct message with verbose option', () => {
    const config = createGlobalConfig({verbose: true});
    expect(getNoTestsFoundMessage([], config)).toMatchSnapshot();
  });

  test('returns correct message without options', () => {
    const config = createGlobalConfig();
    expect(getNoTestsFoundMessage([], config)).toMatchSnapshot();
  });

  test('returns correct message with passWithNoTests', () => {
    const config = createGlobalConfig({passWithNoTests: true});
    expect(getNoTestsFoundMessage([], config)).toMatchSnapshot();
  });
});
