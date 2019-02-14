/* eslint jest/no-focused-tests: 0 */

describe('describe', () => {
  it('it', () => {
    expect(1).toBe(1);
  });
});

describe.only('describe only', () => {
  it.only('it only', () => {
    expect(1).toBe(1);
  });

  it('it', () => {
    expect(1).toBe(1);
  });
});
