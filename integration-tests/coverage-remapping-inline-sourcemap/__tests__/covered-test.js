// Copyright 2004-present Facebook. All Rights Reserved.
const doES6Stuff = require('../covered.js');

it('works correctly', () => {
  const someObj = {someNumber: 10, this: 'is irrelevant'};
  expect(doES6Stuff(someObj, 2)).toBe(20);
});
