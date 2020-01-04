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

function _pluginSyntaxTypescript() {
  const data = _interopRequireDefault(require("@babel/plugin-syntax-typescript"));

  _pluginSyntaxTypescript = function () {
    return data;
  };

  return data;
}

function _core() {
  const data = require("@babel/core");

  _core = function () {
    return data;
  };

  return data;
}

function _helperCreateClassFeaturesPlugin() {
  const data = require("@babel/helper-create-class-features-plugin");

  _helperCreateClassFeaturesPlugin = function () {
    return data;
  };

  return data;
}

var _enum = _interopRequireDefault(require("./enum"));

var _namespace = _interopRequireDefault(require("./namespace"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isInType(path) {
  switch (path.parent.type) {
    case "TSTypeReference":
    case "TSQualifiedName":
    case "TSExpressionWithTypeArguments":
    case "TSTypeQuery":
      return true;

    default:
      return false;
  }
}

const PARSED_PARAMS = new WeakSet();
const GLOBAL_TYPES = new WeakMap();

function isGlobalType(path, name) {
  const program = path.find(path => path.isProgram()).node;
  if (path.scope.hasOwnBinding(name)) return false;
  if (GLOBAL_TYPES.get(program).has(name)) return true;
  console.warn(`The exported identifier "${name}" is not declared in Babel's scope tracker\n` + `as a JavaScript value binding, and "@babel/plugin-transform-typescript"\n` + `never encountered it as a TypeScript type declaration.\n` + `It will be treated as a JavaScript value.\n\n` + `This problem is likely caused by another plugin injecting\n` + `"${name}" without registering it in the scope tracker. If you are the author\n` + ` of that plugin, please use "scope.registerDeclaration(declarationPath)".`);
  return false;
}

function registerGlobalType(programScope, name) {
  GLOBAL_TYPES.get(programScope.path.node).add(name);
}

var _default = (0, _helperPluginUtils().declare)((api, {
  jsxPragma = "React",
  allowNamespaces = false
}) => {
  api.assertVersion(7);
  const JSX_ANNOTATION_REGEX = /\*?\s*@jsx\s+([^\s]+)/;
  return {
    name: "transform-typescript",
    inherits: _pluginSyntaxTypescript().default,
    visitor: {
      Pattern: visitPattern,
      Identifier: visitPattern,
      RestElement: visitPattern,

      Program(path, state) {
        const {
          file
        } = state;
        let fileJsxPragma = null;

        if (!GLOBAL_TYPES.has(path.node)) {
          GLOBAL_TYPES.set(path.node, new Set());
        }

        if (file.ast.comments) {
          for (const comment of file.ast.comments) {
            const jsxMatches = JSX_ANNOTATION_REGEX.exec(comment.value);

            if (jsxMatches) {
              fileJsxPragma = jsxMatches[1];
            }
          }
        }

        for (let stmt of path.get("body")) {
          if (_core().types.isImportDeclaration(stmt)) {
            if (stmt.node.specifiers.length === 0) {
              continue;
            }

            let allElided = true;
            const importsToRemove = [];

            for (const specifier of stmt.node.specifiers) {
              const binding = stmt.scope.getBinding(specifier.local.name);

              if (binding && isImportTypeOnly({
                binding,
                programPath: path,
                jsxPragma: fileJsxPragma || jsxPragma
              })) {
                importsToRemove.push(binding.path);
              } else {
                allElided = false;
              }
            }

            if (allElided) {
              stmt.remove();
            } else {
              for (const importPath of importsToRemove) {
                importPath.remove();
              }
            }

            continue;
          }

          if (stmt.isExportDeclaration()) {
            stmt = stmt.get("declaration");
          }

          if (stmt.isVariableDeclaration({
            declare: true
          })) {
            for (const name of Object.keys(stmt.getBindingIdentifiers())) {
              registerGlobalType(path.scope, name);
            }
          } else if (stmt.isTSTypeAliasDeclaration() || stmt.isTSDeclareFunction() || stmt.isTSInterfaceDeclaration() || stmt.isClassDeclaration({
            declare: true
          }) || stmt.isTSEnumDeclaration({
            declare: true
          }) || stmt.isTSModuleDeclaration({
            declare: true
          }) && stmt.get("id").isIdentifier()) {
            registerGlobalType(path.scope, stmt.node.id.name);
          }
        }
      },

      ExportNamedDeclaration(path) {
        if (!path.node.source && path.node.specifiers.length > 0 && path.node.specifiers.every(({
          local
        }) => isGlobalType(path, local.name))) {
          path.remove();
        }
      },

      ExportSpecifier(path) {
        if (!path.parent.source && isGlobalType(path, path.node.local.name)) {
          path.remove();
        }
      },

      ExportDefaultDeclaration(path) {
        if (_core().types.isIdentifier(path.node.declaration) && isGlobalType(path, path.node.declaration.name)) {
          path.remove();
        }
      },

      TSDeclareFunction(path) {
        path.remove();
      },

      TSDeclareMethod(path) {
        path.remove();
      },

      VariableDeclaration(path) {
        if (path.node.declare) {
          path.remove();
        }
      },

      VariableDeclarator({
        node
      }) {
        if (node.definite) node.definite = null;
      },

      ClassMethod(path) {
        const {
          node
        } = path;
        if (node.accessibility) node.accessibility = null;
        if (node.abstract) node.abstract = null;
        if (node.optional) node.optional = null;
      },

      ClassProperty(path) {
        const {
          node
        } = path;
        if (node.accessibility) node.accessibility = null;
        if (node.abstract) node.abstract = null;
        if (node.readonly) node.readonly = null;
        if (node.optional) node.optional = null;
        if (node.definite) node.definite = null;
        if (node.typeAnnotation) node.typeAnnotation = null;
      },

      TSIndexSignature(path) {
        path.remove();
      },

      ClassDeclaration(path) {
        const {
          node
        } = path;

        if (node.declare) {
          path.remove();
          return;
        }
      },

      Class(path) {
        const {
          node
        } = path;
        if (node.typeParameters) node.typeParameters = null;
        if (node.superTypeParameters) node.superTypeParameters = null;
        if (node.implements) node.implements = null;
        if (node.abstract) node.abstract = null;
        path.get("body.body").forEach(child => {
          const childNode = child.node;

          if (_core().types.isClassMethod(childNode, {
            kind: "constructor"
          })) {
            const parameterProperties = [];

            for (const param of childNode.params) {
              if (param.type === "TSParameterProperty" && !PARSED_PARAMS.has(param.parameter)) {
                PARSED_PARAMS.add(param.parameter);
                parameterProperties.push(param.parameter);
              }
            }

            if (parameterProperties.length) {
              const assigns = parameterProperties.map(p => {
                let id;

                if (_core().types.isIdentifier(p)) {
                  id = p;
                } else if (_core().types.isAssignmentPattern(p) && _core().types.isIdentifier(p.left)) {
                  id = p.left;
                } else {
                  throw path.buildCodeFrameError("Parameter properties can not be destructuring patterns.");
                }

                return _core().template.statement.ast`this.${id} = ${id}`;
              });
              (0, _helperCreateClassFeaturesPlugin().injectInitialization)(path, child, assigns);
            }
          } else if (child.isClassProperty()) {
            childNode.typeAnnotation = null;

            if (!childNode.value && !childNode.decorators) {
              child.remove();
            }
          }
        });
      },

      Function({
        node
      }) {
        if (node.typeParameters) node.typeParameters = null;
        if (node.returnType) node.returnType = null;
        const p0 = node.params[0];

        if (p0 && _core().types.isIdentifier(p0) && p0.name === "this") {
          node.params.shift();
        }

        node.params = node.params.map(p => {
          return p.type === "TSParameterProperty" ? p.parameter : p;
        });
      },

      TSModuleDeclaration(path) {
        (0, _namespace.default)(path, _core().types, allowNamespaces);
      },

      TSInterfaceDeclaration(path) {
        path.remove();
      },

      TSTypeAliasDeclaration(path) {
        path.remove();
      },

      TSEnumDeclaration(path) {
        (0, _enum.default)(path, _core().types);
      },

      TSImportEqualsDeclaration(path) {
        throw path.buildCodeFrameError("`import =` is not supported by @babel/plugin-transform-typescript\n" + "Please consider using " + "`import <moduleName> from '<moduleName>';` alongside " + "Typescript's --allowSyntheticDefaultImports option.");
      },

      TSExportAssignment(path) {
        throw path.buildCodeFrameError("`export =` is not supported by @babel/plugin-transform-typescript\n" + "Please consider using `export <value>;`.");
      },

      TSTypeAssertion(path) {
        path.replaceWith(path.node.expression);
      },

      TSAsExpression(path) {
        let {
          node
        } = path;

        do {
          node = node.expression;
        } while (_core().types.isTSAsExpression(node));

        path.replaceWith(node);
      },

      TSNonNullExpression(path) {
        path.replaceWith(path.node.expression);
      },

      CallExpression(path) {
        path.node.typeParameters = null;
      },

      NewExpression(path) {
        path.node.typeParameters = null;
      },

      JSXOpeningElement(path) {
        path.node.typeParameters = null;
      },

      TaggedTemplateExpression(path) {
        path.node.typeParameters = null;
      }

    }
  };

  function visitPattern({
    node
  }) {
    if (node.typeAnnotation) node.typeAnnotation = null;
    if (_core().types.isIdentifier(node) && node.optional) node.optional = null;
  }

  function isImportTypeOnly({
    binding,
    programPath,
    jsxPragma
  }) {
    for (const path of binding.referencePaths) {
      if (!isInType(path)) {
        return false;
      }
    }

    if (binding.identifier.name !== jsxPragma) {
      return true;
    }

    let sourceFileHasJsx = false;
    programPath.traverse({
      JSXElement() {
        sourceFileHasJsx = true;
      },

      JSXFragment() {
        sourceFileHasJsx = true;
      }

    });
    return !sourceFileHasJsx;
  }
});

exports.default = _default;