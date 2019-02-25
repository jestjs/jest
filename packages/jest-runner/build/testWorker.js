'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.worker = worker;

function _jestHasteMap() {
  const data = _interopRequireDefault(require('jest-haste-map'));

  _jestHasteMap = function _jestHasteMap() {
    return data;
  };

  return data;
}

function _exit() {
  const data = _interopRequireDefault(require('exit'));

  _exit = function _exit() {
    return data;
  };

  return data;
}

function _jestMessageUtil() {
  const data = require('jest-message-util');

  _jestMessageUtil = function _jestMessageUtil() {
    return data;
  };

  return data;
}

function _jestRuntime() {
  const data = _interopRequireDefault(require('jest-runtime'));

  _jestRuntime = function _jestRuntime() {
    return data;
  };

  return data;
}

var _runTest = _interopRequireDefault(require('./runTest'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function() {
    var self = this,
      args = arguments;
    return new Promise(function(resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'next', value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'throw', err);
      }
      _next(undefined);
    });
  };
}

// Make sure uncaught errors are logged before we exit.
process.on('uncaughtException', err => {
  console.error(err.stack);
  (0, _exit().default)(1);
});

const formatError = error => {
  if (typeof error === 'string') {
    const _separateMessageFromS = (0,
      _jestMessageUtil().separateMessageFromStack)(error),
      message = _separateMessageFromS.message,
      stack = _separateMessageFromS.stack;

    return {
      message,
      stack,
      type: 'Error'
    };
  }

  return {
    code: error.code || undefined,
    message: error.message,
    stack: error.stack,
    type: 'Error'
  };
};

const resolvers = Object.create(null);

const getResolver = (config, moduleMap) => {
  // In watch mode, the raw module map with all haste modules is passed from
  // the test runner to the watch command. This is because jest-haste-map's
  // watch mode does not persist the haste map on disk after every file change.
  // To make this fast and consistent, we pass it from the TestRunner.
  if (moduleMap) {
    return _jestRuntime().default.createResolver(config, moduleMap);
  } else {
    const name = config.name;

    if (!resolvers[name]) {
      resolvers[name] = _jestRuntime().default.createResolver(
        config,
        _jestRuntime()
          .default.createHasteMap(config)
          .readModuleMap()
      );
    }

    return resolvers[name];
  }
};

function worker(_x) {
  return _worker.apply(this, arguments);
}

function _worker() {
  _worker = _asyncToGenerator(function*({
    config,
    globalConfig,
    path,
    serializableModuleMap,
    context
  }) {
    try {
      const moduleMap = serializableModuleMap
        ? _jestHasteMap().default.ModuleMap.fromJSON(serializableModuleMap)
        : null;
      return yield (0, _runTest.default)(
        path,
        globalConfig,
        config,
        getResolver(config, moduleMap),
        context
      );
    } catch (error) {
      throw formatError(error);
    }
  });
  return _worker.apply(this, arguments);
}
