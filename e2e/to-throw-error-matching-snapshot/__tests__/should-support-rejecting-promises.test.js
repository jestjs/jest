test('should support rejecting promises', () => {
  return expect(Promise.reject(new Error('octopus'))).rejects.toThrowErrorMatchingSnapshot();
});