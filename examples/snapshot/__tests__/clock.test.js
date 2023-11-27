// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

'use strict';

import renderer from 'react-test-renderer';
import Clock from '../Clock';

jest.useFakeTimers().setSystemTime(1_482_363_367_071);

it('renders correctly', () => {
  const testRenderer = renderer.create(<Clock />);

  try {
    expect(testRenderer.toJSON()).toMatchSnapshot();
  } finally {
    testRenderer.unmount();
  }
});
