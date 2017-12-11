/* globals fail */

describe('abc', () => {
  it('runs abc', () => {});
});

describe('def', () => {
  beforeAll(() => fail('Ran beforeAll for def'));

  it('does not run def', () => {
    fail('ran def');
  });
});
