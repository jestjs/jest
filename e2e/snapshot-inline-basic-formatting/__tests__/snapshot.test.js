/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

describe('inline snapshot serializer', () => {
  it('does not show prototypes for object and array', () => {
    const object = {
      array: [{hello: 'Danger'}],
    };
    expect(object).toMatchInlineSnapshot(`
{
  "array": [
    {
      "hello": "Danger",
    },
  ],
}
`);
  });
});
