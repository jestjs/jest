// Copyright 2004-present Facebook. All Rights Reserved.
interface NotUsedButTakesUpLines {
  a: number;
  b: string;
}

it('fails', () => {
  // wrapped in arrow function for character offset
  (() => expect(false).toBe(true))();
});
