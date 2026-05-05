/**
 * @jest-environment jsdom
 */

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {render} from '@testing-library/react';
import App from '../src/App';

it('generates a snapshot with correctly transformed dependencies', () => {
  const {container} = render(<App />);
  expect(container.firstChild).toMatchSnapshot();
});
