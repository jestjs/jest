const path = require('path');
const getMockName = require('../getMockName');

describe('getMockName', () => {
  it('extracts mock name from file path', () => {
    expect(
      getMockName(path.join('a', '__mocks__', 'c.js'))
    ).toBe('c');

    expect(
      getMockName(path.join('a', '__mocks__', 'c', 'd.js'))
    ).toBe(path.join('c', 'd'));
  });
});
