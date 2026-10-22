// The JavaScriptCore host (see JSEngine.swift) provides these.
declare function setTimeout(fn: (...args: any[]) => void, ms?: number): number;
declare function clearTimeout(id: number | undefined): void;
declare function setInterval(fn: (...args: any[]) => void, ms?: number): number;
declare function clearInterval(id: number | undefined): void;
declare const console: { log(...a: any[]): void; warn(...a: any[]): void; error(...a: any[]): void };

declare module "react-refresh/runtime" {
  export function injectIntoGlobalHook(global: unknown): void;
  export function register(type: unknown, id: string): void;
  export function createSignatureFunctionForTransform(): unknown;
  export function performReactRefresh(): unknown;
}
