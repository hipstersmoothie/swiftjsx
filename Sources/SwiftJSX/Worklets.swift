import JavaScriptCore
import SwiftUI

/// Runs worklets: small JS functions that run on the main thread, in their own
/// JSContext, instead of on the JS thread with React.
///
/// - Gesture handlers that are worklets run synchronously inside the touch
///   event, so a dragged view moves in the same frame as the finger.
/// - Shared values (`useSharedValue`) live here; the JS thread writes them
///   with messages and gets changes back asynchronously.
/// - Animated styles (`useAnimatedStyle` → `animatedStyle` prop) re-run when
///   a shared value they read changes. Their result overrides those props on
///   the node (`Node.animatedProps`) without a React render.
/// - `withSpring` / `withTiming` don't step frames in JS: the style change is
///   applied inside SwiftUI's `withAnimation`, which interpolates natively.
///
/// Worklet functions arrive as `{ __worklet: { code, closure } }`, produced
/// by the worklets Babel pass (scripts/worklets-plugin.mjs).
@MainActor
final class WorkletRuntime {
    private let context: JSContext
    private let api: JSValue
    private weak var tree: NodeTree?
    /// Compiled gesture handlers per "node:event", reused while the prop is unchanged.
    private var handlers: [String: (source: NSDictionary, function: JSValue)] = [:]
    private let callJS: (Int, [Any]) -> Void
    private let syncToJS: ([String: Any]) -> Void
    private let report: (String) -> Void
    /// Animations of the steps the last flush applied ("none" if unanimated), for tests.
    private(set) var lastSteps: [String] = []

    init(tree: NodeTree, callJS: @escaping (Int, [Any]) -> Void, syncToJS: @escaping ([String: Any]) -> Void,
         report: @escaping (String) -> Void) {
        self.tree = tree
        self.callJS = callJS
        self.syncToJS = syncToJS
        self.report = report
        context = JSContext(virtualMachine: JSVirtualMachine())!
        context.name = "SwiftJSX worklets"

        let host = JSValue(newObjectIn: context)!
        let log: @convention(block) (String) -> Void = { print("[worklet] \($0)") }
        host.setObject(log, forKeyedSubscript: "log" as NSString)
        // Worklets run on main: play it now.
        let haptic: @convention(block) (JSValue) -> Void = { kind in
            let name = kind.isString ? kind.toString() : nil
            MainActor.assumeIsolated { playHaptic(name) }
        }
        host.setObject(haptic, forKeyedSubscript: "haptic" as NSString)
        context.setObject(host, forKeyedSubscript: "__host" as NSString)
        api = context.evaluateScript(Self.prelude)!

        context.exceptionHandler = { _, exception in
            let message = exception?.toString() ?? "unknown error"
            let stack = exception?.objectForKeyedSubscript("stack")?.toString() ?? ""
            MainActor.assumeIsolated { report("Worklet error: \(message)\n\(stack)") }
        }
    }

    // MARK: From the node tree

    /// The node's `animatedStyle` prop was set, changed or removed.
    func setStyle(_ node: Node, _ worklet: Any?) {
        guard let worklet = worklet as? [String: Any], worklet["__worklet"] != nil else {
            removeStyle(node)
            return
        }
        let props = api.invokeMethod("setStyle", withArguments: [node.id, worklet])
        node.setAnimatedProps(props?.toDictionary() as? [String: Any] ?? [:])
        flush()
    }

    func removeStyle(_ node: Node) {
        api.invokeMethod("removeStyle", withArguments: [node.id])
        handlers = handlers.filter { !$0.key.hasPrefix("\(node.id):") }
    }

    // MARK: From views

    /// Whether the node's handler for `event` is a worklet.
    static func isWorklet(_ value: Any?) -> Bool {
        (value as? [String: Any])?["__worklet"] != nil
    }

    /// Runs a worklet event handler now, on the main thread.
    func run(_ node: Node, _ event: String, _ payload: Any?) {
        guard let source = node.props[event] as? [String: Any] else { return }
        let key = "\(node.id):\(event)"
        let dictionary = source as NSDictionary
        let function: JSValue
        if let cached = handlers[key], cached.source.isEqual(dictionary) {
            function = cached.function
        } else {
            guard let compiled = api.invokeMethod("compile", withArguments: [source["__worklet"]!]) else { return }
            function = compiled
            handlers[key] = (dictionary, compiled)
        }
        function.call(withArguments: payload.map { [$0] } ?? [])
        flush()
    }

    // MARK: From the JS thread

    /// `{ type: "create" | "set" | "delete", id, value }` for a shared value.
    func handle(_ message: [String: Any]) {
        api.invokeMethod("message", withArguments: [message])
        flush()
    }

    // MARK: Applying results

    /// Re-runs styles whose shared values changed and applies them, animated
    /// if the change was (`withSpring`, `withTiming`). Unanimated changes
    /// disable animations, so a dragged view never lags behind the finger.
    private func flush() {
        guard let result = api.invokeMethod("flush", withArguments: [])?.toDictionary() else { return }
        let updates = result["styles"] as? [Any] ?? []
        if !updates.isEmpty {
            lastSteps = updates.map { (($0 as? [String: Any])?["animation"] as? [String: Any])?["type"] as? String ?? "none" }
        }
        for case let update as [String: Any] in updates {
            guard let id = (update["node"] as? NSNumber)?.intValue, let node = tree?.node(id) else { continue }
            let props = update["props"] as? [String: Any] ?? [:]
            if let animation = parseAnimation(update["animation"]) {
                withAnimation(animation) { node.setAnimatedProps(props) }
            } else {
                var transaction = Transaction()
                transaction.disablesAnimations = true
                withTransaction(transaction) { node.setAnimatedProps(props) }
            }
        }
        if let values = result["values"] as? [String: Any], !values.isEmpty {
            syncToJS(values)
        }
        // After the sync, so JS-thread callbacks see the values the worklet wrote.
        for case let call as [Any] in result["calls"] as? [Any] ?? [] {
            guard let id = (call.first as? NSNumber)?.intValue else { continue }
            callJS(id, call.dropFirst().first as? [Any] ?? [])
        }
    }

    // MARK: Prelude

    private static let prelude = #"""
    (() => {
      const shared = new Map();   // id -> { value, styles: Set<nodeId>, proxy }
      const styles = new Map();   // nodeId -> { fn, deps: Set<id> }
      const changed = new Map();  // id -> { animation, previous }, since the last flush
      const calls = [];           // [id, args] of JS-thread functions, run after the flush
      const warned = new Set();
      const toJS = new Map();     // id -> value written by a worklet, to sync back
      let tracking = null;

      function entry(id) {
        let s = shared.get(id);
        if (!s) {
          s = { value: undefined, styles: new Set(), proxy: null };
          s.proxy = {
            __shared: id,
            get value() { if (tracking) tracking.add(id); return s.value; },
            set value(v) { set(id, v, true); },
            get() { return this.value; },
            set(v) { set(id, v, true); },
          };
          shared.set(id, s);
        }
        return s;
      }

      function set(id, v, fromWorklet) {
        const s = entry(id);
        let animation = null;
        if (v && typeof v === "object" && v.__animate) { animation = v.animation; v = v.to; }
        const previous = changed.has(id) ? changed.get(id).previous : s.value;
        changed.set(id, { animation, previous });
        s.value = v;
        if (fromWorklet) toJS.set(id, v);
      }

      const builtins = {
        withSpring: (to, config) => ({ __animate: true, to, animation: { type: "spring", ...config } }),
        withTiming: (to, config = {}) => ({
          __animate: true, to,
          animation: { type: config.easing ?? "easeInOut", duration: config.duration ?? 0.3, delay: config.delay },
        }),
        withAnimation: (animation, to) => ({ __animate: true, to, animation }),
        runOnJS: (fn) => fn.__runOnJS ?? fn,
        haptic: (kind) => __host.haptic(kind),
      };

      function hydrate(v) {
        if (Array.isArray(v)) return v.map(hydrate);
        if (v && typeof v === "object") {
          if ("__shared" in v) return entry(v.__shared).proxy;
          if ("__worklet" in v) return compile(v.__worklet);
          if ("__jsFunction" in v) {
            const id = v.__jsFunction;
            const call = (...args) => { calls.push([id, args]); };
            // Called without runOnJS: usually a helper missing "worklet".
            const direct = (...args) => {
              if (!warned.has(id)) {
                warned.add(id);
                __host.log(`A worklet called ${v.name}(), a JS-thread function: it runs later on the JS thread and returns undefined. Mark it "worklet" to run it here, or call it through runOnJS().`);
              }
              call(...args);
            };
            direct.__runOnJS = call;
            return direct;
          }
          if ("__builtin" in v) return builtins[v.__builtin];
          const out = {};
          for (const k in v) out[k] = hydrate(v[k]);
          return out;
        }
        return v;
      }

      const factories = new Map();
      function compile(w) {
        const closure = w.closure ?? {};
        const keys = Object.keys(closure);
        const key = keys.join(",") + "\n" + w.code;
        let factory = factories.get(key);
        if (!factory) {
          factory = new Function(...keys, "return (" + w.code + ");");
          factories.set(key, factory);
        }
        return factory(...keys.map((k) => hydrate(closure[k])));
      }

      function evaluate(node) {
        const st = styles.get(node);
        for (const id of st.deps) shared.get(id)?.styles.delete(node);
        tracking = new Set();
        let props;
        try {
          props = st.fn();
        } finally {
          st.deps = tracking;
          tracking = null;
          for (const id of st.deps) entry(id).styles.add(node);
        }
        return props ?? {};
      }

      function removeStyle(node) {
        const st = styles.get(node);
        if (!st) return;
        for (const id of st.deps) shared.get(id)?.styles.delete(node);
        styles.delete(node);
      }

      return {
        compile,
        setStyle(node, w) {
          removeStyle(node);
          styles.set(node, { fn: compile(w.__worklet), deps: new Set() });
          return evaluate(node);
        },
        removeStyle,
        message(m) {
          if (m.type === "delete") shared.delete(m.id);
          else set(m.id, m.value, false);
        },
        // Styles whose shared values changed, re-evaluated. Values changed with
        // different animations are applied in steps, one animation each (only
        // that group's values new so far), so a spring on one value and a
        // timing curve on another both keep their own curve. Unanimated
        // changes go last.
        flush() {
          const byNode = new Map();  // node -> Map<animation key, { animation, ids }>
          for (const [id, change] of changed) {
            const s = shared.get(id);
            if (!s) continue;
            const key = change.animation ? JSON.stringify(change.animation) : "";
            for (const node of s.styles) {
              const groups = byNode.get(node) ?? new Map();
              const group = groups.get(key) ?? { animation: change.animation, ids: [] };
              group.ids.push(id);
              groups.set(key, group);
              byNode.set(node, groups);
            }
          }
          const out = [];
          for (const [node, groups] of byNode) {
            if (!styles.has(node)) continue;
            const steps = [...groups.values()].sort((a, b) => (a.animation ? 0 : 1) - (b.animation ? 0 : 1));
            if (steps.length === 1) {
              out.push({ node, props: evaluate(node), animation: steps[0].animation });
              continue;
            }
            const ids = steps.flatMap((step) => step.ids);
            const now = new Map(ids.map((id) => [id, shared.get(id).value]));
            for (const id of ids) shared.get(id).value = changed.get(id).previous;
            for (const step of steps) {
              for (const id of step.ids) shared.get(id).value = now.get(id);
              out.push({ node, props: evaluate(node), animation: step.animation });
            }
          }
          changed.clear();
          const values = {};
          for (const [id, v] of toJS) values[id] = v;
          toJS.clear();
          return { styles: out, values, calls: calls.splice(0) };
        },
      };
    })()
    """#
}
