// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

'use strict';

import {act} from 'react-dom/test-utils';
import renderer from 'react-test-renderer';
import Clock from '../Clock';

jest.useFakeTimers().setSystemTime(1482363367071);

it('renders correctly', () => {
  act(() => {
    const reactTestRenderer = renderer.create(<Clock />);
    const tree = reactTestRenderer.toJSON();

    try {
      expect(tree).toMatchSnapshot();
    } finally {
      reactTestRenderer.unmount();
    }
  });
});
