const scroll = require('../scrollList');

it('When offset is -1', () => {
  expect(scroll(25, { offset: -1, max: 10 })).toEqual({
    end: 10,
    index: -1,
    start: 0,
  });
});

it('When offset is in the first set of items', () => {
  expect(scroll(25, { offset: 4, max: 10 })).toEqual({
    end: 10,
    index: 4,
    start: 0,
  });

  expect(scroll(25, { offset: 6, max: 10 })).toEqual({
    end: 10,
    index: 6,
    start: 0,
  });
});

it('When offset is in the middle of the list', () => {
  expect(scroll(25, { offset: 7, max: 10 })).toEqual({
    end: 11,
    index: 6,
    start: 1,
  });

  expect(scroll(25, { offset: 14, max: 10 })).toEqual({
    end: 18,
    index: 6,
    start: 8,
  });
});

it('When offset is at the end of the list', () => {
  expect(scroll(25, { offset: 23, max: 10 })).toEqual({
    end: 25,
    index: 8,
    start: 15,
  });

  expect(scroll(25, { offset: 25, max: 10 })).toEqual({
    end: 25,
    index: 10,
    start: 15,
  });

  expect(scroll(25, { offset: 35, max: 10 })).toEqual({
    end: 25,
    index: 10,
    start: 15,
  });
});
