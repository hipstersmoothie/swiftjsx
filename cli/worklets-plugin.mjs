// Babel pass for worklets (see js/worklets.ts).
//
// A function is a worklet if its body starts with a "worklet" directive, or if
// it's a callback of useAnimatedStyle(), useDerivedValue() or
// useAnimatedReaction(), or `<Canvas draw>` (markAutoWorklets gives those the
// directive before the React Compiler runs; this pass runs after it). Each one
// becomes
//
//   __swiftjsx_worklet(fn, "<its source as plain JS>", () => ({ a, b }))
//
// where { a, b } are the variables it uses from enclosing scopes (read when the
// worklet is sent to the main thread, so helpers declared further down a module
// work). The main thread compiles the source in its own JS context and calls it
// with those values. `function f() { "worklet"; … }` declarations are
// registered right after the declaration.

import generatorModule from "@babel/generator";
import { transformSync } from "esbuild";

const generate = generatorModule.default ?? generatorModule;

/** Hooks whose callbacks (all function arguments) are worklets. */
const AUTO_WORKLET_CALLEES = new Set(["useAnimatedStyle", "useDerivedValue", "useAnimatedReaction"]);
/** JSX props that are worklets: `<Canvas draw={(ctx) => …}>`. */
const AUTO_WORKLET_PROPS = { Canvas: new Set(["draw"]) };

/**
 * Runs before the React Compiler: gives callbacks that are worklets by
 * position a "worklet" directive, so they're still found after the compiler
 * has hoisted them out of the call.
 */
export function markAutoWorklets({ types: t }) {
  function mark(fn) {
    if (!t.isArrowFunctionExpression(fn) && !t.isFunctionExpression(fn)) return;
    if (!t.isBlockStatement(fn.body)) fn.body = t.blockStatement([t.returnStatement(fn.body)]);
    if (!fn.body.directives.some((d) => d.value.value === "worklet")) fn.body.directives.unshift(t.directive(t.directiveLiteral("worklet")));
  }
  return {
    name: "swiftjsx-auto-worklets",
    visitor: {
      CallExpression(path) {
        const callee = path.node.callee;
        const name = t.isIdentifier(callee) ? callee.name : t.isMemberExpression(callee) && t.isIdentifier(callee.property) ? callee.property.name : null;
        if (name && AUTO_WORKLET_CALLEES.has(name)) path.node.arguments.forEach(mark);
      },
      JSXAttribute(path) {
        const element = path.parentPath.node.name;
        const props = t.isJSXIdentifier(element) ? AUTO_WORKLET_PROPS[element.name] : undefined;
        if (!props || !t.isJSXIdentifier(path.node.name) || !props.has(path.node.name.name)) return;
        if (t.isJSXExpressionContainer(path.node.value)) mark(path.node.value.expression);
      },
    },
  };
}

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
    return parent.isCallExpression() && parent.node.arguments.includes(path.node) && AUTO_WORKLET_CALLEES.has(calleeName(parent.node));
  }

  /** Variables the function reads that are declared outside it (globals excluded). */
  function capturedNames(path) {
    const names = new Set();
    path.traverse({
      ReferencedIdentifier(ref) {
        // `(offset: SharedValue<Point>) => …`: types are erased, not captured.
        if (ref.findParent((p) => p.isTSType() || p.isTSTypeAnnotation() || p.isTSTypeParameterInstantiation())) return;
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

  /** `__swiftjsx_worklet(fn, code, () => ({ captured }))` */
  function register(fn, path) {
    const closure = t.arrowFunctionExpression([], t.objectExpression(
      capturedNames(path).map((name) => t.objectProperty(t.identifier(name), t.identifier(name), false, true)),
    ));
    return t.callExpression(t.memberExpression(t.identifier("globalThis"), t.identifier("__swiftjsx_worklet")), [
      fn,
      t.stringLiteral(source(path)),
      closure,
    ]);
  }

  return {
    name: "swiftjsx-worklets",
    visitor: {
      "ArrowFunctionExpression|FunctionExpression"(path) {
        if (path.node.__swiftjsxWorklet || !isWorklet(path)) return;
        path.node.__swiftjsxWorklet = true;
        path.replaceWith(register(path.node, path));
      },
      FunctionDeclaration(path) {
        if (path.node.__swiftjsxWorklet || !isWorklet(path) || !path.node.id) return;
        path.node.__swiftjsxWorklet = true;
        const statement = t.expressionStatement(register(t.identifier(path.node.id.name), path));
        // `export function f` / `export default function f`: register after the export.
        (path.parentPath.isExportDeclaration() ? path.parentPath : path).insertAfter(statement);
      },
    },
  };
}
