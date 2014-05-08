
var request = require('request');
var glob = require('glob');
var fs = require('fs');
var mkdirp = require('mkdirp');
var server = require('./server.js');

// Sadly, our setup fatals when doing multiple concurrent requests
// I don't have the time to dig into why, it's easier to just serialize
// requests.
var queue = (function() {
  var is_executing = false;
  var queue = [];
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
    var fn = queue.shift();
    is_executing = true;
    fn(function() {
      is_executing = false;
      execute()
    });
  }
  return {push: push};
})();

glob('src/**/*.*', function (er, files) {
  var count = files.length;

  function done() {
    if (--count === 0) {
      console.log('Check out the build/ folder!');
      server.close();
    }
  }

  files.forEach(function(file) {
    var targetFile = file.replace(/^src/, 'build');

    if (file.match(/\.js$/)) {
      targetFile = targetFile.replace(/\.js$/, '.html');
      queue.push(function(cb) {
        console.log(targetFile);
        request('http://localhost:8079/' + targetFile.replace(/^build\//, ''), function(error, response, body) {
          mkdirp.sync(targetFile.replace(new RegExp('/[^/]*$'), ''));
          fs.writeFileSync(targetFile, body);
          done();
          cb();
        });
      });
    } else {
      queue.push(function(cb) {
        console.log(targetFile);
        fs.readFile(file, function(err, file) {
          mkdirp.sync(targetFile.replace(new RegExp('/[^/]*$'), ''));
          fs.writeFileSync(targetFile, file.toString());
          done();
          cb();
        });
      });
    }
  });
})
