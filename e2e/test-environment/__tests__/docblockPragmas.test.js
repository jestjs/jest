/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * @jest-environment ./DocblockPragmasEnvironment.js
 * @my-custom-pragma pragma-value
 */

test('docblock pragmas', () => {
  expect(myCustomPragma).toEqual('pragma-value'); // eslint-disable-line no-undef
});
