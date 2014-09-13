'use strict';

var HasteUpdateServer = require('./HasteUpdateServer');

var q = require('q');
var fs = require('fs');
var path = require('path');
var util = require('util');

var Promise = q.Promise;

var logFile = fs.createWriteStream(
  path.join(process.cwd(), '.haste_server.log'),
  {flags: 'a'}
);
function log() {
  var message = '[' + (new Date()) + '] ' + util.format.apply(util, arguments);
  return new Promise(function(resolve, reject) {
    logFile.write(message + '\n', resolve);
  });
}

var server = null;

function onMessage(msg) {
  return new Promise(function(resolve, reject) {
    switch (msg.type) {
      case 'status':
        if (!server) {
          resolve(HasteUpdateServer.STATES.PRE_START);
        } else {
          resolve(server.getState());
        }
        break;

      case 'start':
        if (!Array.isArray(msg.configs)) {
          reject(new Error('Need a configs parameter'));
          return;
        }
        server = new HasteUpdateServer(msg.configs, {logger: log});
        resolve(true);
        break;

      default:
        reject(new Error('Unkown message type: ' + msg.type));
    }
  });
}

process.on('uncaughtException', function(err) {
  log(err.stack).then(function() {
    process.exit(1);
  });
});

process.on('exit', function() {
  logFile.end('exiting\n');
});

exports.onMessage = onMessage;
