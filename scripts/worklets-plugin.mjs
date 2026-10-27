// Babel pass for worklets (see js/worklets.ts).
//
// A function is a worklet if its body starts with a "worklet" directive, or if
// it's the callback passed to useAnimatedStyle(). Each one becomes
//
//   __swiftjsx_worklet(fn, "<its source as plain JS>", { a, b })
//
// where { a, b } are the variables it uses from enclosing scopes, captured when
// the function is created (each render). The main thread compiles the source
// in its own JS context and calls it with those values.

import generatorModule from "@babel/generator";
import { transformSync } from "esbuild";

const generate = generatorModule.default ?? generatorModule;

const AUTO_WORKLET_CALLEES = new Set(["useAnimatedStyle"]);

export default function workletsPlugin({ types: t }) {
  function calleeName(call) {
    const callee = call.callee;
    if (t.isIdentifier(callee)) return callee.name;
    if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) return callee.property.name;
    return null;
  }

  function isWorklet(path) {
    const body = path.node.body;
    if (t.isBlockStatement(body) && body.directives.some((d) => d.value.value === "worklet")) return true;
    const parent = path.parentPath;
    return parent.isCallExpression() && parent.node.arguments[0] === path.node && AUTO_WORKLET_CALLEES.has(calleeName(parent.node));
  }

  /** Variables the function reads that are declared outside it (globals excluded). */
  function capturedNames(path) {
    const names = new Set();
    path.traverse({
      ReferencedIdentifier(ref) {
        const binding = ref.scope.getBinding(ref.node.name);
        if (!binding) return;
        for (let scope = binding.scope; scope; scope = scope.parent) {
          if (scope === path.scope) return;
        }
        names.add(ref.node.name);
      },
    });
    return [...names].sort();
  }

  /** The function's source without the directive, with TypeScript stripped. */
  function source(path) {
    const clone = t.cloneNode(path.node, true);
    if (t.isBlockStatement(clone.body)) clone.body.directives = clone.body.directives.filter((d) => d.value.value !== "worklet");
    if (t.isFunctionDeclaration(clone)) clone.type = "FunctionExpression";
    const ts = generate(clone, { comments: false }).code;
    const js = transformSync(`(${ts})`, { loader: "ts", target: "es2020", minifyWhitespace: true }).code;
    return js.trim().replace(/;$/, "");
  }

  return {
    name: "swiftjsx-worklets",
    visitor: {
      "ArrowFunctionExpression|FunctionExpression"(path) {
        if (path.node.__swiftjsxWorklet || !isWorklet(path)) return;
        path.node.__swiftjsxWorklet = true;
        const code = source(path);
        const closure = t.objectExpression(
          capturedNames(path).map((name) => t.objectProperty(t.identifier(name), t.identifier(name), false, true)),
        );
        path.replaceWith(
          t.callExpression(t.memberExpression(t.identifier("globalThis"), t.identifier("__swiftjsx_worklet")), [
            path.node,
            t.stringLiteral(code),
            closure,
          ]),
        );
      },
    },
  };
}
