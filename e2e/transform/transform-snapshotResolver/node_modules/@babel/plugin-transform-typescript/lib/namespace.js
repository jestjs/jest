"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transpileNamespace;

function _core() {
  const data = require("@babel/core");

  _core = function () {
    return data;
  };

  return data;
}

function transpileNamespace(path, t, allowNamespaces) {
  if (path.node.declare || path.node.id.type === "StringLiteral") {
    path.remove();
    return;
  }

  if (!allowNamespaces) {
    throw path.hub.file.buildCodeFrameError(path.node.id, "Namespace not marked type-only declare." + " Non-declarative namespaces are only supported experimentally in Babel." + " To enable and review caveats see:" + " https://babeljs.io/docs/en/babel-plugin-transform-typescript");
  }

  const name = path.node.id.name;
  const value = handleNested(path, t, t.cloneDeep(path.node));
  const bound = path.scope.hasOwnBinding(name);

  if (path.parent.type === "ExportNamedDeclaration") {
    if (!bound) {
      path.parentPath.insertAfter(value);
      path.replaceWith(getDeclaration(t, name));
      path.scope.registerDeclaration(path.parentPath);
    } else {
      path.parentPath.replaceWith(value);
    }
  } else if (bound) {
    path.replaceWith(value);
  } else {
    path.scope.registerDeclaration(path.replaceWithMultiple([getDeclaration(t, name), value])[0]);
  }
}

function getDeclaration(t, name) {
  return t.variableDeclaration("let", [t.variableDeclarator(t.identifier(name))]);
}

function getMemberExpression(t, name, itemName) {
  return t.memberExpression(t.identifier(name), t.identifier(itemName));
}

function handleNested(path, t, node, parentExport) {
  const names = new Set();
  const realName = node.id;
  const name = path.scope.generateUid(realName.name);
  const namespaceTopLevel = node.body.body;

  for (let i = 0; i < namespaceTopLevel.length; i++) {
    const subNode = namespaceTopLevel[i];

    switch (subNode.type) {
      case "TSModuleDeclaration":
        {
          const transformed = handleNested(path, t, subNode);
          const moduleName = subNode.id.name;

          if (names.has(moduleName)) {
            namespaceTopLevel[i] = transformed;
          } else {
            names.add(moduleName);
            namespaceTopLevel.splice(i++, 1, getDeclaration(t, moduleName), transformed);
          }

          continue;
        }

      case "TSEnumDeclaration":
      case "FunctionDeclaration":
      case "ClassDeclaration":
        names.add(subNode.id.name);
        continue;

      case "VariableDeclaration":
        for (const variable of subNode.declarations) {
          names.add(variable.id.name);
        }

        continue;

      default:
        continue;

      case "ExportNamedDeclaration":
    }

    switch (subNode.declaration.type) {
      case "TSEnumDeclaration":
      case "FunctionDeclaration":
      case "ClassDeclaration":
        {
          const itemName = subNode.declaration.id.name;
          names.add(itemName);
          namespaceTopLevel.splice(i++, 1, subNode.declaration, t.expressionStatement(t.assignmentExpression("=", getMemberExpression(t, name, itemName), t.identifier(itemName))));
          break;
        }

      case "VariableDeclaration":
        if (subNode.declaration.kind !== "const") {
          throw path.hub.file.buildCodeFrameError(subNode.declaration, "Namespaces exporting non-const are not supported by Babel." + " Change to const or see:" + " https://babeljs.io/docs/en/babel-plugin-transform-typescript");
        }

        for (const variable of subNode.declaration.declarations) {
          variable.init = t.assignmentExpression("=", getMemberExpression(t, name, variable.id.name), variable.init);
        }

        namespaceTopLevel[i] = subNode.declaration;
        break;

      case "TSModuleDeclaration":
        {
          const transformed = handleNested(path, t, subNode.declaration, t.identifier(name));
          const moduleName = subNode.declaration.id.name;

          if (names.has(moduleName)) {
            namespaceTopLevel[i] = transformed;
          } else {
            names.add(moduleName);
            namespaceTopLevel.splice(i++, 1, getDeclaration(t, moduleName), transformed);
          }
        }
    }
  }

  let fallthroughValue = t.objectExpression([]);

  if (parentExport) {
    fallthroughValue = _core().template.expression.ast`
      ${parentExport}.${realName} || (
        ${parentExport}.${realName} = ${fallthroughValue}
      )
    `;
  }

  return _core().template.statement.ast`
    (function (${t.identifier(name)}) {
      ${namespaceTopLevel}
    })(${realName} || (${realName} = ${fallthroughValue}));
  `;
}