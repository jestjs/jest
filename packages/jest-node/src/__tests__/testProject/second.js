describe('second', () => {
  it('should succeed', done => {
    setTimeout(() => {
      expect(1).toBe(1);
      done();
    }, 100);
  });

  it('should fail', done => {
    setTimeout(() => {
      expect(1).toBe(2);
      done();
    }, 100);
  });
});
