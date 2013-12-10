var fs = require('fs');
var path = require('path');
var Q = require('q');

function _replaceRootDirTags(rootDir, config) {
  var objValue;
  switch (typeof config) {
    case 'object':
      if (Array.isArray(config)) {
        return config.map(function(item) {
          return _replaceRootDirTags(rootDir, item);
        });
      } else if (config !== null) {
        for (var configKey in config) {
          config[configKey] = _replaceRootDirTags(rootDir, config[configKey]);
        }
        return config;
      }
      break;
    case 'string':
      return config.replace(/<rootDir>/g, rootDir);
  }
  return config;
}

function loadConfigFromFile(filePath) {
  return Q.nfcall(fs.readFile, filePath, 'utf8').then(function(fileData) {
    var config = JSON.parse(fileData);
    var rootDir = path.resolve(path.dirname(filePath), config.rootDir);
    return _replaceRootDirTags(rootDir, config);
  });
}

function readAndPreprocessFileContent(filePath, config) {
  var fileData = fs.readFileSync(filePath, 'utf8');
  if (config.scriptPreprocessor) {
    fileData = require(config.scriptPreprocessor).process(fileData, filePath);
  }
  return fileData;
}

function runContentWithLocalBindings(contextRunner, scriptContent, scriptPath,
                                     bindings) {
  var boundIdents = Object.keys(bindings);
  var wrapperFunc = contextRunner(
    '(function(' + boundIdents.join(',') + '){' +
    scriptContent +
    '\n})',
    scriptPath
  );
  var bindingValues = boundIdents.map(function(ident) {
    return bindings[ident];
  });
  wrapperFunc.apply(null, bindingValues);
}

function serializeConsoleArgValue(arg) {
  switch (typeof arg) {
    case 'function':
      return JSON.stringify({
        type: 'function',
        value: arg.toString()
      });

    case 'object':
      if (arg === null) {
        return JSON.stringify({
          type: 'null',
          value: 'null'
        });
      }

      var retValue = {};
      for (var key in arg) {
        retValue[key] = serializeConsoleArgValue(arg[key]);
      }
      return JSON.stringify({
        type: 'object',
        value: retValue
      });

    case 'undefined':
      return JSON.stringify({
        type: 'undefined',
        value: 'undefined'
      });

    case 'boolean':
    case 'number':
    case 'string':
      return JSON.stringify({
        type: 'json',
        value: arg
      });
      break;

    default:
      throw new Error('Unexpected console.XXX arg type!', typeof arg);
  }
}

function stringifySerializedConsoleArgValue(arg) {
  var metadata = JSON.parse(arg);
  switch (metadata.type) {
    case 'null':
      return 'null';
    case 'object':
      var ret = {};
      for (var key in metadata.value) {
        ret[key] = stringifySerializedConsoleArgValue(metadata.value[key]);
      }
      return JSON.stringify(ret);
    case 'undefined':
      return 'undefined';
    case 'function':
    case 'json':
      return metadata.value;
    default:
      throw new Error('Unexpected serialized console.XXX type!', metadata);
  }
}

exports.loadConfigFromFile = loadConfigFromFile;
exports.readAndPreprocessFileContent = readAndPreprocessFileContent;
exports.runContentWithLocalBindings = runContentWithLocalBindings;
exports.serializeConsoleArgValue = serializeConsoleArgValue;
exports.stringifySerializedConsoleArgValue = stringifySerializedConsoleArgValue;
