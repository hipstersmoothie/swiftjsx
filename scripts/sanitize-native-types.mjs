// Fixes invalid TypeScript from NativeScript's declaration emitter, in place:
//  - C parameter names that are reserved words (`in`, `default`, …) get a `_`
//    (not `this`: TypeScript's `this:` parameter is valid and is used);
//  - unnamed C struct fields (emitted as `: type;`) get a name.
//
//   node scripts/sanitize-native-types.mjs nativescript/types/ios
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const reserved = "break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch throw true try typeof var void while with yield let static implements interface package private protected public await".split(" ");
const param = new RegExp(`([(,]\\s*)(\\.\\.\\.)?(${reserved.join("|")})(\\??\\s*:)`, "g");

const dir = process.argv[2];
let changed = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".d.ts"))) {
  const path = `${dir}/${file}`;
  const source = readFileSync(path, "utf8");
  let unnamed = 0;
  const fixed = source
    .replace(param, (_m, pre, rest = "", name, post) => `${pre}${rest}${name}_${post}`)
    .replace(/^(\s+):\s/gm, (_m, indent) => `${indent}_unnamed${unnamed++}: `);
  if (fixed !== source) {
    writeFileSync(path, fixed);
    changed++;
  }
}
console.log(`sanitized ${changed} file(s) in ${dir}`);
