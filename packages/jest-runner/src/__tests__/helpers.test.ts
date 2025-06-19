/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {replaceFunctionsWithStringReferences} from '../helpers';

it('serialize functions inside the nested object', () => {
  const obj = {
    foo: () => {},
    nested: {
      fn: function bar() {
        return 0;
      },
    },
    nestedArray: [{baz: function baz() {}}, () => {}],
  };

  expect(replaceFunctionsWithStringReferences(obj)).toEqual({
    foo: '[Function foo]',
    nested: {
      fn: '[Function bar]',
    },
    nestedArray: [
      {
        baz: '[Function baz]',
      },
      '[Function anonymous]',
    ],
  });
});
