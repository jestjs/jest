// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

'use strict';

import renderer from 'react-test-renderer';
import Clock from '../Clock';

jest.useFakeTimers().setSystemTime(1482363367071);

it('renders correctly', () => {
  const tree = renderer.create(<Clock />).toJSON();
  expect(tree).toMatchSnapshot();
});
