'use strict';

var MapUpdateTask = require('node-haste/lib/MapUpdateTask');

var hasteUtils = require('./hasteUtils');
var os = require('os');
var sane = require('sane');
var path = require('path');
var q = require('q');
var _ = require('underscore');

var Promise = q.Promise;

var UPDATE_DELAY = 300;

var DEFAULT_PORT = 5622;

var STATES = {
  PRE_START: 'pre_start',
  STARTING: 'starting',
  UPDATING: 'updating',
  READY: 'ready'
};

function HasteUpdateServer(configs, options) {
  this._state = STATES.STARTING;
  this._options = options || {};
  this._options.port = this._options.port || DEFAULT_PORT;
  this._configs = configs;
  this._hasteToDataMap = new Map();
  this._rootToHasteMap = new Map();
  this._hasteDataToCallsMap = new Map();
  this.debug = this._options.logger || function(){};
  this.debug('initializing');
  q.all([
    this._constructHasteInstances(),
    this._watchDirectories()
  ]).done(function() {
    this.debug('done initializing');
    this._state = STATES.READY;
  }.bind(this));
}

HasteUpdateServer.prototype._constructHasteInstances = function() {
  return q.all(
    this._configs.map(constructHasteAndUpdate.bind(null, this._options))
  ).then(function(hastesAndData) {
    hastesAndData.forEach(function(hasteAndData) {
      var haste = hasteAndData.haste;
      var hasteData = hasteAndData.hasteData;
      this._hasteToDataMap.set(haste, hasteData);
      hasteData.config.testPathDirs.forEach(function(testPathDir) {
        this._rootToHasteMap.set(testPathDir, haste);
      }, this);
    }, this);
  }.bind(this));
};

HasteUpdateServer.prototype._handler = function(socket) {
  this.debug('connection');
  socket.end(this._state);
};

HasteUpdateServer.prototype._watchDirectories = function() {
  return new Promise(function(resolve, reject) {
    var numDirsToWatch = this._configs.reduce(function(acc, config) {
      return acc + config.testPathDirs.length;
    }, 0);
    resolve = _.after(numDirsToWatch, resolve);

    this._watchers = this._configs.map(function(config) {
      return config.testPathDirs.map(function(testPathDir) {
        var watcher = sane(testPathDir);
        watcher.on('ready', resolve);
        watcher.on('error', reject);
        watcher.on('all', this._changeHandler.bind(this));
        return watcher;
      }, this);
    }, this);
  }.bind(this));
};

HasteUpdateServer.prototype._changeHandler = function(type, file, root, stat) {
  this.debug('File Watcher event:', type, file, root);

  if (stat && stat.isDirectory()) {
    return;
  }

  // Haste deals with absolute paths.
  file = path.join(root, file);

  var haste = this._rootToHasteMap.get(root);
  var hasteData = this._hasteToDataMap.get(haste);
  var map = hasteData.map;
  var config = hasteData.config;
  var fileIgnorePattern = hasteUtils.getHasteIgnoreRegex(config);

  if (file.match(fileIgnorePattern)) {
    this.debug('File ignored');
    return;
  }

  var index = null;

  // Transform to a pair of path,mtime which is accepted by the update task.
  var files = map.getAllResources().map(function(resource, i) {
    if (resource.path === file) {
      index = i;
    }
    return [resource.path, resource.mtime];
  });

  if (type !== 'add' && index == null) {
    // We can't delete or change a file that we don't know about.
    // This could happen when a directory is deleted. Since the HasteMap
    // doesn't have directory records. This could also happen if we got
    // an add event and then got a change event on the same file immediately
    // after and before the update task finishes. In both cases we can simply
    // ignore the event.
    return;
  }

  switch (type) {
    case 'delete':
      files.splice(index, 1);
      break;
    case 'add':
      files.push([file, stat.mtime.getTime()]);
      break;
    case 'change':
      this.debug('before', files[index]);
      files[index][1] = stat.mtime.getTime();
      this.debug('after', files[index]);
      break;
    default:
      this.debug('Unknown change type', type);
      return;
  }

  this._debouncedUpdateMap(haste, hasteData, files);
};

HasteUpdateServer.prototype._debouncedUpdateMap = function(haste, hasteData, files) {
  if (this._hasteDataToCallsMap.has(hasteData)) {
    var updateCall = this._hasteDataToCallsMap.get(hasteData);
    updateCall(files);
  } else {
    var updateCall = _.debounce(
      this._doUpdateMap.bind(this, haste, hasteData),
      UPDATE_DELAY
    );
    updateCall(files);
    this._hasteDataToCallsMap.set(hasteData, updateCall);
  }
};

HasteUpdateServer.prototype._doUpdateMap = function(haste, hasteData, files) {
  var map = hasteData.map;
  var config = hasteData.config;

  // Clean up first
  this._hasteDataToCallsMap.delete(hasteData);

  this._state = STATES.UPDATING;

  var task = new MapUpdateTask(
    files,
    hasteUtils.buildLoadersList(config),
    map,
    {
      maxOpenFiles: this._options.maxOpenFiles || 100,
      maxProcesses: this._options.maxProcesses || os.cpus().length
    }
  );

  var d = Date.now();

  var ready = function() {
    this._state = STATES.READY;
    this.debug('update completed in', Date.now() - d);
  }.bind(this);

  task.on('complete', function(map) {

    var mapChanged = task.changed.length > task.skipped.length;
    if (mapChanged) {
      hasteData.map = map;
      haste.storeMap(hasteUtils.getCacheFilePath(config), map, ready);
    } else {
      ready();
    }
  });

  this.debug('starting node-haste map update task');
  task.run();
};

HasteUpdateServer.prototype.getState = function() {
  return this._state;
};

function constructHasteAndUpdate(options, config) {
  return new Promise(function(resolve) {
    var haste = hasteUtils.constructHasteInst(config, options);
    var hasteData = { config: config };

    haste.update(hasteUtils.getCacheFilePath(config), function(map) {
      hasteData.map = map;
      resolve({
        haste: haste,
        hasteData: hasteData
      });
    });
  });
}

// Export states.
HasteUpdateServer.STATES = STATES;
module.exports = HasteUpdateServer;
