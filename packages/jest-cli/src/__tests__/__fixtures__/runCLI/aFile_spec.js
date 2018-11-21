const expect = require('expect');
const aFile = require('./aFile');

describe('aFile test', () => {
  it('should have transformed aFile', () => {
    expect(JSON.stringify(aFile)).toEqual(JSON.stringify({ 'replaced2': 1 }));
  })
});