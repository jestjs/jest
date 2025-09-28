// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

'use strict';

import {cleanup, render} from '@testing-library/react';
import Clock from '../Clock';

jest.useFakeTimers().setSystemTime(1_482_363_367_071);

it('renders correctly', () => {
  const {container} = render(<Clock />);
  try {
    expect(container.firstChild).toMatchSnapshot();
  } finally {
    cleanup();
  }
});
