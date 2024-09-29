/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import serializeToJSON from '../serializeToJSON';

// populate an object with all basic JavaScript datatypes
const object = {
  species: 'capybara',
  ok: true,
  i: ['pull up'],
  hopOut: {
    atThe: 'after party',
    when: new Date('2000-07-14'),
  },
  chillness: 100,
  weight: 9.5,
  flaws: null,
  location: undefined,
};

it('serializes regular objects like JSON.stringify', () => {
  expect(serializeToJSON(object)).toEqual(JSON.stringify(object));
});

it('serializes errors', () => {
  const objectWithError = {
    ...object,
    error: new Error('too cool'),
  };
  const withError = serializeToJSON(objectWithError);
  const withoutError = JSON.stringify(objectWithError);

  expect(withoutError).not.toEqual(withError);

  expect(withError).toContain(`"message":"too cool"`);
  expect(withError).toContain(`"name":"Error"`);
  expect(withError).toContain(`"stack":"Error:`);

  expect(JSON.parse(withError)).toMatchObject({
    error: {
      message: 'too cool',
      name: 'Error',
    },
  });
});
