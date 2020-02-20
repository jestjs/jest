const http = require('http');

it('should not timeout', async () => {
  const server = http.createServer();
  await new Promise(resolve => {
    server.listen(resolve);
  });
  await new Promise((resolve, reject) => {
    server.close(err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
});
