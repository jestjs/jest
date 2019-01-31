const {Track} = require('@@storage/track/Track');
jest.mock('@@storage/track/Track');

test('through moduleNameMapper', () => {
  const track = new Track();
  expect(track.someRandomFunction).not.toBeCalled();
});
