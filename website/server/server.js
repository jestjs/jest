"use strict";
var connect = require('connect');
var http = require('http');
var optimist = require('optimist');
var path = require('path');
var reactMiddleware = require('react-page-middleware');
var build = require('./build.js');

var argv = optimist.argv;

var PROJECT_ROOT = path.resolve(__dirname, '..');
var FILE_SERVE_ROOT = path.join(PROJECT_ROOT, 'src');

var port = argv.port;

var buildOptions = {
  projectRoot: PROJECT_ROOT,
  pageRouteRoot: FILE_SERVE_ROOT,
  useBrowserBuiltins: false,
  logTiming: true,
  useSourceMaps: true,
  ignorePaths: function(p) {
    return p.indexOf('__tests__') !== -1;
  },
  serverRender: true,
  dev: argv.dev !== 'false'
};

var isServer = !argv.computeForPath;
if (!isServer) {
  reactMiddleware.compute(buildOptions)(argv.computeForPath, function(str) {
    process.stdout.write(str);
  });
} else {
  var app = connect()
    .use(function(req, res, next) {
      // build on every single request
      build();
      next();
    })
    .use(reactMiddleware.provide(buildOptions))
    .use(connect['static'](FILE_SERVE_ROOT))
    .use(connect.favicon(path.join(FILE_SERVE_ROOT, 'elements', 'favicon', 'favicon.ico')))
    .use(connect.logger())
    .use(connect.compress())
    .use(connect.errorHandler());

  var portToUse = port || 8080;
  http.createServer(app).listen(portToUse);
  console.log('Open http://localhost:' + portToUse + '/jest/index.html');
}
