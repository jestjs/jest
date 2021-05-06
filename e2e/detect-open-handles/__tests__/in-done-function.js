const http = require('http');

test('something', done => {
  const server = http.createServer((_, response) => response.end('ok'));
  server.listen(0, () => {
    expect(true).toBe(true);
    done();
  });
});
