const path = require('path');
const getMockName = require('../getMockName');

describe('getMockName', () => {
  it('extracts mock name from file path', () => {
    expect(
      getMockName(path.join('a', '__b__', 'c.js'), /__b__/)
    ).toBe('c');

    expect(
      getMockName(path.join('a', '__b__', 'index.js'), /__b__/)
    ).toBe('index');

    expect(
      getMockName(path.join('a', '__b__', 'c', 'd.js'), /__b__/)
    ).toBe(path.join('c', 'd'));

    expect(
      getMockName(path.join('a', '__b__', 'c', 'd', 'index.js'), /__b__/)
    ).toBe(path.join('c', 'd'));
  });
});
