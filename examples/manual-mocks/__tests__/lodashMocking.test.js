// Copyright 2004-present Facebook. All Rights Reserved.

import lodash from 'lodash';

test('if lodash head is mocked', () => {
  expect(lodash.head([2, 3])).toEqual(5);
});
