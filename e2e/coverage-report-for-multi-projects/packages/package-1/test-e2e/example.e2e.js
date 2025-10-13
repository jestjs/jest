const {package1} = require('../index.js');

describe('Example Package 1 Test', () => {
  it('should run', () => {
    expect(package1()).toBeTruthy();
  });
});
