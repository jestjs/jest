declare var process: {
  binding(type: string): {},
};

const BUILTIN_MODULES = Object.keys(process.binding('natives')).filter(
  (module: string) => !/^internal\//.test(module),
);

module.exports = function isBuiltinModule(module: string): boolean {
  return BUILTIN_MODULES.indexOf(module) !== -1;
};
