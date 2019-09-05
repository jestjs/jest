'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var _exportNames = {
  run: true
};
Object.defineProperty(exports, 'run', {
  enumerable: true,
  get: function() {
    return _run.default;
  }
});
exports.default = void 0;

var _jestAdapter = _interopRequireDefault(
  require('./legacy-code-todo-rewrite/jestAdapter')
);

var _state = require('./state');

Object.keys(_state).forEach(function(key) {
  if (key === 'default' || key === '__esModule') return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function() {
      return _state[key];
    }
  });
});

var _run = _interopRequireDefault(require('./run'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

var _default = _jestAdapter.default;
exports.default = _default;
