"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _helperPluginUtils() {
  const data = require("@babel/helper-plugin-utils");

  _helperPluginUtils = function () {
    return data;
  };

  return data;
}

function _pluginTransformTypescript() {
  const data = _interopRequireDefault(require("@babel/plugin-transform-typescript"));

  _pluginTransformTypescript = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = (0, _helperPluginUtils().declare)((api, {
  jsxPragma,
  allExtensions = false,
  isTSX = false
}) => {
  api.assertVersion(7);

  if (typeof allExtensions !== "boolean") {
    throw new Error(".allExtensions must be a boolean, or undefined");
  }

  if (typeof isTSX !== "boolean") {
    throw new Error(".isTSX must be a boolean, or undefined");
  }

  if (isTSX && !allExtensions) {
    throw new Error("isTSX:true requires allExtensions:true");
  }

  return {
    overrides: allExtensions ? [{
      plugins: [[_pluginTransformTypescript().default, {
        jsxPragma,
        isTSX
      }]]
    }] : [{
      test: /\.ts$/,
      plugins: [[_pluginTransformTypescript().default, {
        jsxPragma
      }]]
    }, {
      test: /\.tsx$/,
      plugins: [[_pluginTransformTypescript().default, {
        jsxPragma,
        isTSX: true
      }]]
    }]
  };
});

exports.default = _default;