const request = require('request');
const glob = require('glob');
const fs = require('fs.extra');
const mkdirp = require('mkdirp');
const server = require('./server.js');
const feed = require('./feed');

// Sadly, our setup fatals when doing multiple concurrent requests
// I don't have the time to dig into why, it's easier to just serialize
// requests.
const queue = (function() {
  let is_executing = false;
  const queue = [];
  function push(fn) {
    queue.push(fn);
    execute();
  }
  function execute() {
    if (is_executing) {
      return;
    }
    if (queue.length === 0) {
      return;
    }
    const fn = queue.shift();
    is_executing = true;
    fn(() => {
      is_executing = false;
      execute();
    });
  }
  return {push};
})();

queue.push(cb => {
  fs.writeFileSync('build/jest/blog/feed.xml', feed('rss'));
  fs.writeFileSync('build/jest/blog/atom.xml', feed('atom'));
  console.log('Generated RSS feed');
  cb();
});

glob('src/**/*.*', (er, files) => {
  files.forEach(file => {
    let targetFile = file.replace(/^src/, 'build');

    if (file.match(/\.js$/)) {
      targetFile = targetFile.replace(/\.js$/, '.html');
      queue.push(cb => {
        request('http://localhost:8079/' + targetFile.replace(/^build\//, ''), (error, response, body) => {
          mkdirp.sync(targetFile.replace(new RegExp('/[^/]*$'), ''));
          fs.writeFileSync(targetFile, body);
          cb();
        });
      });
    } else {
      queue.push(cb => {
        mkdirp.sync(targetFile.replace(new RegExp('/[^/]*$'), ''));
        fs.copy(file, targetFile, cb);
      });
    }
  });

  queue.push(cb => {
    console.log('Generated website');
    server.close();
    cb();
  });
});
