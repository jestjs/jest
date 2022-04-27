/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import renderer from 'react-test-renderer';

test('<div>x</div>', () => {
  expect(renderer.create(<div>x</div>).toJSON()).toMatchInlineSnapshot(`
    <div>
      y
    </div>
  `);
});
