// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

/* global document */

test('a failed assertion comparing a DOM node does not crash Jest', () => {
  expect(document.body).toBe(null);
});
