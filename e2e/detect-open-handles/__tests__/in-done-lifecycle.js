const http = require('http');

beforeAll(done => {
  const server = http.createServer((_, response) => response.end('ok'));
  server.listen(0, () => {
    done();
  });
});

test('something', () => {
  expect(true).toBe(true);
});
