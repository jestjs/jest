var tsc = require('typescript');

module.exports = {
  process: function(src, path) {
    // TypeScript files can be .ts, .tsx
    var result = src;
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      var d = [];
      result = tsc.transpile(src, {module: tsc.ModuleKind.CommonJS, jsx: tsc.JsxEmit.React}, path, d);
      if (d.length !== 0) {
        //console.log("transpile info. path=", path, ", d=", d, ", ", JSON.stringify(result));
      }
    }
    return result;
  }
};
