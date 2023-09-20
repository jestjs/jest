// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

'use strict';

import renderer from 'react-test-renderer';
import Clock from '../Clock';

jest.useFakeTimers().setSystemTime(1482363367071);

it('renders correctly', () => {
  const testRenderer = renderer.create(<Clock />);

  try {
    expect(testRenderer.toJSON()).toMatchSnapshot();
  } finally {
    testRenderer.unmount();
  }
});
