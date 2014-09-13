'use strict';

var path = require('path');
var Client = require('persistent-daemon/src/Client');

/**
 * Usage
 *
 * var HasteUpdateClient = require('jest/HasteModuleLoader/HasteUpdateClient');
 * var client = HasteUpdateClient.createClient({ port: 8000 });
 * client.getStatus().then(function(status) { console.log(status); });
 */

/**
 * Constants
 */

var DEFUALT_PORT = 8082;

exports.createClient = function(options) {
  options = options || {};
  var daemonPath = path.resolve(__dirname, 'hasteUpdateDaemon.js');
  var client = new Client(options.port || DEFUALT_PORT, daemonPath);
  return {
    start: function(configs) {
      return client.sendMsg({ type: 'start', configs: configs });
    },
    status: function() {
      return client.sendMsg({ type: 'status' });
    },
    disconnect: function() {
      client.disconnect();
    }
  };
};
