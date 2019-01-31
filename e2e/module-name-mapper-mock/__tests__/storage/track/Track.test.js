const {Track} = require('../../../src/storage/track/Track');
jest.mock('@@storage/track/Track');

test('relative import', () => {
  const track = new Track();
  expect(track.someRandomFunction).not.toBeCalled();
});
