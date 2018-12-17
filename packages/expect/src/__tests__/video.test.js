class Blah {
  *[Symbol.iterator]() {
    yield this;
  }
}

const video = {
  play(x) {
    console.log('received', x);
    return true;
  },
};

test('plays video', () => {
  const val = new Blah();
  const spy = jest.spyOn(video, 'play');
  const isPlaying = video.play(val);

  expect(spy).toHaveBeenCalledWith(val);
  expect(isPlaying).toBe(true);
});
