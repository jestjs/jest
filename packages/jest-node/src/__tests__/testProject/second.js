describe('second', function() {
  it('should succeed', function(done) {
    setTimeout(function(){
      expect(1).toBe(1);
      done();
    }, 100);
  });
  
  it('should fail', function(done) {
    setTimeout(function(){
      expect(1).toBe(2);
      done();
    }, 100);
  });
})