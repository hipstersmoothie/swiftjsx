extension WorkletRuntime {
    /// The worklet context's own runtime: shared values, the animation engine,
    /// animated styles, derived values, reactions and canvases. Evaluates to
    /// the object `WorkletRuntime` calls into (`api`).
    static let prelude = #"""
    (() => {
      const shared = new Map();    // id -> { value, styles: Set<nodeId>, proxy }
      const styles = new Map();    // nodeId -> { fn, deps: Set<id> }
      const canvases = new Map();  // nodeId -> { key, fn, deps: Set<id> }
      const derived = new Map();   // id -> { fn, deps: Set<id> }
      const reactions = new Map(); // id -> { prepare, react, deps: Set<id>, previous }
      const changed = new Map();   // id -> { animation, previous }, since the last flush
      const dirty = new Set();     // ids changed since derived values and reactions last ran
      const calls = [];            // [id, args] of JS-thread functions, run after the flush
      const warned = new Set();
      const toJS = new Map();      // id -> value to sync back to the JS thread
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

      /** Writes a value; `animation` is a SwiftUI animation spec (values that can't be interpolated here). */
      function assign(id, v, animation, fromWorklet) {
        const s = entry(id);
        const previous = changed.has(id) ? changed.get(id).previous : s.value;
        changed.set(id, { animation, previous });
        dirty.add(id);
        s.value = v;
        if (fromWorklet) toJS.set(id, v);
      }

      function set(id, v, fromWorklet) {
        const s = entry(id);
        if (isAnimation(v)) {
          if (drivable(v, s.value)) return start(id, v);
          // Colors, booleans, strings: SwiftUI interpolates them when the style applies.
          cancel(id);
          return assign(id, finalValue(v, s.value), nativeSpec(v), fromWorklet);
        }
        cancel(id);
        assign(id, v, null, fromWorklet);
      }

      // MARK: Values as trees of numbers

      const isAnimation = (v) => !!v && typeof v === "object" && v.__animate === true;
      function isNumeric(v) {
        if (typeof v === "number") return Number.isFinite(v);
        if (Array.isArray(v)) return v.length > 0 && v.every(isNumeric);
        if (v && typeof v === "object") { const keys = Object.keys(v); return keys.length > 0 && keys.every((k) => isNumeric(v[k])); }
        return false;
      }
      function sameShape(a, b) {
        if (typeof a === "number" || typeof b === "number") return typeof a === "number" && typeof b === "number";
        if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((x, i) => sameShape(x, b[i]));
        if (a && b && typeof a === "object" && typeof b === "object") {
          const ka = Object.keys(a), kb = Object.keys(b);
          return ka.length === kb.length && ka.every((k) => k in b && sameShape(a[k], b[k]));
        }
        return false;
      }
      /** fn(leaf of each tree…) over `shape`; trees missing a leaf give 0. */
      function combine(shape, trees, fn) {
        if (typeof shape === "number") return fn(...trees.map((t) => (typeof t === "number" ? t : 0)));
        if (Array.isArray(shape)) return shape.map((x, i) => combine(x, trees.map((t) => t?.[i]), fn));
        const out = {};
        for (const k in shape) out[k] = combine(shape[k], trees.map((t) => t?.[k]), fn);
        return out;
      }
      function leaves(v, out = []) {
        if (typeof v === "number") out.push(v);
        else if (Array.isArray(v)) v.forEach((x) => leaves(x, out));
        else if (v && typeof v === "object") for (const k in v) leaves(v[k], out);
        return out;
      }
      const zero = (shape) => combine(shape, [], () => 0);
      /** A velocity: a number for every leaf, or a tree like the value. */
      const velocityLike = (shape, v) => (typeof v === "number" ? combine(shape, [], () => v) : sameShape(shape, v) ? v : zero(shape));
      function equal(a, b) {
        if (a === b) return true;
        if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
        const ka = Object.keys(a);
        return ka.length === Object.keys(b).length && ka.every((k) => equal(a[k], b[k]));
      }

      // MARK: Animations (stepped here, every frame)

      /** The value an animation ends at, from `from`. */
      function finalValue(d, from) {
        switch (d.kind) {
          case "timing": case "spring": return d.to;
          case "delay": return finalValue(d.animation, from);
          case "sequence": return d.animations.reduce((v, a) => finalValue(a, v), from);
          case "repeat": {
            const count = d.count ?? 2;
            if (count < 0 || !Number.isFinite(count)) return finalValue(d.animation, from);
            return d.reverse && count % 2 === 0 ? from : finalValue(d.animation, from);
          }
          default: return from;
        }
      }
      /** Whether the engine can step it: numbers (or trees of them) all the way. */
      function drivable(d, from) {
        if (d.kind === "decay") return isNumeric(from);
        const to = finalValue(d, from);
        return isNumeric(to) && (from === undefined || sameShape(from, to)) && targets(d).every(isNumeric);
      }
      function targets(d) {
        switch (d.kind) {
          case "timing": case "spring": return [d.to];
          case "delay": case "repeat": return targets(d.animation);
          case "sequence": return d.animations.flatMap(targets);
          default: return [];
        }
      }
      /** For values SwiftUI animates (colors…): the closest SwiftUI animation. */
      function nativeSpec(d) {
        if (d.kind === "timing") return { type: d.easing ?? "easeInOut", duration: d.duration ?? 0.3, delay: d.delay };
        if (d.kind === "spring") return { type: "spring", duration: d.duration, bounce: d.bounce };
        if (d.kind === "delay") { const inner = nativeSpec(d.animation); return inner && { ...inner, delay: (inner.delay ?? 0) + d.delay }; }
        return null;
      }

      function bezier(x1, y1, x2, y2) {
        const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
        const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
        const x = (t) => ((ax * t + bx) * t + cx) * t;
        const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
        return (p) => {
          let t = p;
          for (let i = 0; i < 8; i++) {
            const e = x(t) - p, d = dx(t);
            if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break;
            t -= e / d;
          }
          t = Math.min(1, Math.max(0, t));
          return ((ay * t + by) * t + cy) * t;
        };
      }
      const easings = {
        linear: (p) => p,
        easeIn: bezier(0.42, 0, 1, 1),
        easeOut: bezier(0, 0, 0.58, 1),
        easeInOut: bezier(0.42, 0, 0.58, 1),
      };
      const easing = (e) => (Array.isArray(e) ? bezier(...e) : easings[e ?? "easeInOut"] ?? easings.easeInOut);

      /**
       * SwiftUI's spring parameters (perceptual duration and bounce), or
       * physical ones (stiffness, damping, mass; as in Reanimated).
       */
      function springShape(d) {
        if (d.stiffness !== undefined || d.damping !== undefined || d.mass !== undefined) {
          const k = Math.max(0.01, d.stiffness ?? 100), c = Math.max(0, d.damping ?? 10), m = Math.max(0.01, d.mass ?? 1);
          return { omega: Math.sqrt(k / m), zeta: c / (2 * Math.sqrt(k * m)) };
        }
        const named = { bouncy: [0.5, 0.3], snappy: [0.5, 0.15], smooth: [0.5, 0] }[d.preset];
        const duration = d.duration ?? named?.[0] ?? 0.5;
        const bounce = Math.min(0.99, d.bounce ?? named?.[1] ?? 0);
        const omega = (2 * Math.PI) / Math.max(0.01, duration);
        const zeta = bounce >= 0 ? 1 - bounce : 1 / (1 + Math.max(-0.99, bounce));
        return { omega, zeta };
      }

      // Each animator: step(now) → value, done, velocity (per second).
      function animator(d, from, velocity) {
        switch (d.kind) {
          case "timing": {
            const to = d.to;
            const start0 = sameShape(from, to) ? from : to;
            const duration = Math.max(0, d.duration ?? 0.3);
            const ease = easing(d.easing);
            let start = null;
            const a = { done: false, value: start0, velocity: zero(to), callback: d.callback,
              step(now) {
                if (start === null) start = now + (d.delay ?? 0);
                const t = now - start;
                if (t < 0) return a.value;
                const p = duration === 0 ? 1 : Math.min(1, t / duration);
                const e = ease(p);
                const value = combine(to, [start0, to], (f, x) => f + (x - f) * e);
                const h = 1e-3, e2 = ease(Math.min(1, p + h));
                a.velocity = p >= 1 || duration === 0 ? zero(to) : combine(to, [start0, to], (f, x) => ((x - f) * (e2 - e)) / (h * duration));
                a.value = value;
                if (p >= 1) a.done = true;
                return value;
              } };
            return a;
          }
          case "spring": {
            const to = d.to;
            const start0 = sameShape(from, to) ? from : to;
            const { omega, zeta } = springShape(d);
            const v0 = velocityLike(to, d.velocity ?? velocity);
            const x0 = combine(to, [start0, to], (f, x) => f - x);
            const scale = Math.max(1, ...leaves(x0).map(Math.abs));
            const rest = 0.001 * scale;
            let start = null;
            const leaf = (x, v, t) => {
              const a = zeta * omega;
              if (zeta < 1) {
                const w = omega * Math.sqrt(1 - zeta * zeta);
                const B = (v + a * x) / w, e = Math.exp(-a * t), c = Math.cos(w * t), s = Math.sin(w * t);
                return [e * (x * c + B * s), e * (v * c - ((a * v + omega * omega * x) / w) * s)];
              }
              if (zeta === 1) {
                const e = Math.exp(-omega * t), k = v + omega * x;
                return [e * (x + k * t), e * (v - omega * k * t)];
              }
              const r = Math.sqrt(zeta * zeta - 1), r1 = -omega * (zeta - r), r2 = -omega * (zeta + r);
              const C2 = (v - r1 * x) / (r2 - r1), C1 = x - C2;
              const e1 = Math.exp(r1 * t), e2 = Math.exp(r2 * t);
              return [C1 * e1 + C2 * e2, r1 * C1 * e1 + r2 * C2 * e2];
            };
            const a = { done: false, value: start0, velocity: v0, callback: d.callback,
              step(now) {
                if (start === null) start = now + (d.delay ?? 0);
                const t = now - start;
                if (t < 0) return a.value;
                let settled = true;
                const value = combine(to, [x0, v0, to], (x, v, target) => {
                  const [dx, dv] = leaf(x, v, t);
                  if (Math.abs(dx) > rest || Math.abs(dv) > rest * 10) settled = false;
                  return target + dx;
                });
                a.velocity = combine(to, [x0, v0], (x, v) => leaf(x, v, t)[1]);
                if (settled || t > 20) { a.done = true; a.value = to; a.velocity = zero(to); return to; }
                a.value = value;
                return value;
              } };
            return a;
          }
          case "decay": {
            const start0 = from;
            const v0 = velocityLike(from, d.velocity ?? velocity);
            const k = -Math.log(d.deceleration ?? 0.998) * 1000;
            const clamp = d.clamp;
            let start = null;
            const a = { done: false, value: start0, velocity: v0, callback: d.callback,
              step(now) {
                if (start === null) start = now;
                const t = now - start;
                let moving = false;
                const e = Math.exp(-k * t);
                let value = combine(from, [start0, v0], (x, v) => {
                  if (Math.abs(v * e) > 1) moving = true;
                  return x + (v / k) * (1 - e);
                });
                if (clamp && typeof value === "number") {
                  if (value <= clamp[0] || value >= clamp[1]) { value = Math.min(clamp[1], Math.max(clamp[0], value)); moving = false; }
                }
                a.value = value;
                a.velocity = moving ? combine(from, [v0], (v) => v * e) : zero(from);
                if (!moving) a.done = true;
                return value;
              } };
            return a;
          }
          case "delay": {
            let inner = null, start = null;
            const a = { done: false, value: from, velocity: velocity ?? zero(from), callback: d.callback,
              step(now) {
                if (start === null) start = now;
                if (now - start < d.delay) return a.value;
                inner ??= animator(d.animation, a.value, a.velocity);
                a.value = inner.step(now);
                a.velocity = inner.velocity;
                if (inner.done) { finish(inner, true); a.done = true; }
                return a.value;
              } };
            return a;
          }
          case "sequence": {
            let index = 0, inner = null;
            const a = { done: d.animations.length === 0, value: from, velocity: velocity ?? zero(from), callback: d.callback,
              step(now) {
                while (index < d.animations.length) {
                  inner ??= animator(d.animations[index], a.value, a.velocity);
                  a.value = inner.step(now);
                  a.velocity = inner.velocity;
                  if (!inner.done) return a.value;
                  finish(inner, true);
                  inner = null;
                  index++;
                }
                a.done = true;
                return a.value;
              } };
            return a;
          }
          case "repeat": {
            const count = d.count ?? 2;
            const forever = count < 0 || !Number.isFinite(count);
            const origin = from;
            let round = 0, inner = null;
            const next = () => {
              const back = d.reverse && round % 2 === 1;
              const target = back ? origin : null;
              const step = back && "to" in d.animation ? { ...d.animation, to: target } : d.animation;
              // Without reverse, each round starts over from where the first did.
              return animator(step, d.reverse ? a.value : origin, a.velocity);
            };
            const a = { done: false, value: from, velocity: velocity ?? zero(from), callback: d.callback,
              step(now) {
                inner ??= next();
                a.value = inner.step(now);
                a.velocity = inner.velocity;
                if (!inner.done) return a.value;
                finish(inner, true);
                round++;
                if (!forever && round >= count) { a.done = true; return a.value; }
                inner = null;
                return a.value;
              } };
            return a;
          }
        }
        return { done: true, value: from, velocity: zero(from), step: () => from };
      }

      const scrollSyncs = new Map(); // id -> when a scroll offset was last synced to JS
      const running = new Map();  // id -> animator
      const finished = [];        // callbacks to call after the frame's values are in
      function finish(anim, done) {
        if (typeof anim.callback === "function") finished.push(() => anim.callback(done));
      }
      function cancel(id) {
        const anim = running.get(id);
        if (!anim) return;
        running.delete(id);
        finish(anim, false);
      }
      function start(id, d) {
        const s = entry(id);
        const previous = running.get(id);
        // Retargeted mid-flight: the new animation starts at the old one's speed.
        const velocity = previous && sameShape(previous.velocity, s.value) ? previous.velocity : undefined;
        if (previous) { running.delete(id); finish(previous, false); }
        const from = s.value === undefined ? finalValue(d, undefined) : s.value;
        running.set(id, animator(d, from, velocity));
      }
      let lastSync = 0;
      function frame(now) {
        // Ids first: callbacks may start new animations.
        for (const [id, anim] of [...running]) {
          if (running.get(id) !== anim) continue;
          const value = anim.step(now);
          assign(id, value, null, false);
          if (anim.done) {
            running.delete(id);
            toJS.set(id, value);
            finish(anim, true);
          }
        }
        // The JS thread sees animated values about ten times a second (and the last one).
        if (now - lastSync > 0.1) {
          lastSync = now;
          for (const id of running.keys()) toJS.set(id, shared.get(id)?.value);
        }
        for (const callback of finished.splice(0)) callback();
      }

      // MARK: Worklet functions

      const builtins = {
        withSpring: (to, config = {}, callback) => ({ __animate: true, kind: "spring", to, ...config, callback }),
        withTiming: (to, config = {}, callback) => ({ __animate: true, kind: "timing", to, ...config, callback }),
        withDecay: (config = {}, callback) => ({ __animate: true, kind: "decay", ...config, callback }),
        withDelay: (delay, animation) => ({ __animate: true, kind: "delay", delay, animation }),
        withSequence: (...animations) => ({ __animate: true, kind: "sequence", animations }),
        withRepeat: (animation, count = 2, reverse = false, callback) => ({ __animate: true, kind: "repeat", animation, count, reverse, callback }),
        withAnimation: (spec, to) => ({ __animate: true, ...fromSpec(spec), to }),
        cancelAnimation: (value) => cancel(value.__shared),
        runOnJS: (fn) => fn.__runOnJS ?? fn,
        haptic: (kind) => __host.haptic(kind),
      };
      /** A SwiftUI-style spec ("bouncy", { type: "easeOut", duration }) as an animation. */
      function fromSpec(spec) {
        const s = typeof spec === "string" ? { type: spec } : spec ?? {};
        if (["spring", "bouncy", "snappy", "smooth", "default"].includes(s.type ?? "default")) {
          return { kind: "spring", preset: s.type, duration: s.duration, bounce: s.bounce, delay: s.delay };
        }
        return { kind: "timing", easing: s.type, duration: s.duration ?? 0.35, delay: s.delay };
      }

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
              if (!warned.has(id) && !v.callback) {
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

      /** Runs fn, recording the shared values it reads into `into`. */
      function tracked(into, fn) {
        const outer = tracking;
        tracking = new Set();
        try {
          return fn();
        } finally {
          into.clear();
          for (const id of tracking) into.add(id);
          tracking = outer;
        }
      }

      function evaluate(node) {
        const st = styles.get(node);
        for (const id of st.deps) shared.get(id)?.styles.delete(node);
        const props = tracked(st.deps, st.fn);
        for (const id of st.deps) entry(id).styles.add(node);
        return props ?? {};
      }

      function removeStyle(node) {
        const st = styles.get(node);
        if (st) {
          for (const id of st.deps) shared.get(id)?.styles.delete(node);
          styles.delete(node);
        }
        canvases.delete(node);
      }

      // MARK: Derived values and reactions

      function runDerived(id) {
        const d = derived.get(id);
        const value = tracked(d.deps, d.fn);
        if (!equal(value, shared.get(id)?.value) || isAnimation(value)) set(id, value, true);
      }
      function runReaction(id) {
        const r = reactions.get(id);
        const value = tracked(r.deps, r.prepare);
        if (r.started && equal(value, r.previous)) return;
        const previous = r.started ? r.previous : null;
        r.started = true;
        r.previous = value;
        r.react(value, previous);
      }
      /** Re-runs derived values and reactions whose inputs changed, until it settles. */
      function propagate() {
        for (let round = 0; round < 20 && dirty.size; round++) {
          const ids = [...dirty];
          dirty.clear();
          const touched = (deps) => ids.some((id) => deps.has(id));
          for (const [id, d] of derived) if (touched(d.deps)) runDerived(id);
          for (const [id, r] of reactions) if (touched(r.deps)) runReaction(id);
        }
        dirty.clear();
      }

      // MARK: Canvas

      /** A CanvasRenderingContext2D-like recorder: drawing calls become commands Swift replays. */
      function context() {
        const commands = [];
        let path = [];
        const state = { fillStyle: "black", strokeStyle: "black", lineWidth: 1, lineCap: "butt", lineJoin: "miter",
          globalAlpha: 1, font: 12, fontWeight: "regular", textAlign: "start", textBaseline: "alphabetic", dash: [],
          shadowColor: "transparent", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, globalCompositeOperation: "source-over" };
        const stack = [];
        const style = (s) => (s && typeof s === "object" && s.__gradient ? { gradient: s.__gradient } : s);
        /** Shadow and blend mode for one drawing command (the last element), or null. */
        const fx = () => {
          const shadow = state.shadowColor !== "transparent" && (state.shadowBlur > 0 || state.shadowOffsetX || state.shadowOffsetY)
            ? [state.shadowColor, state.shadowBlur, state.shadowOffsetX, state.shadowOffsetY] : null;
          const blend = state.globalCompositeOperation === "source-over" ? null : state.globalCompositeOperation;
          return shadow || blend ? { shadow, blend } : null;
        };
        const isURL = (s) => /^(https?|file|data):/i.test(s);
        const ctx = {
          get commands() { return commands; },
          beginPath() { path = []; },
          moveTo(x, y) { path.push("M", x, y); },
          lineTo(x, y) { path.push("L", x, y); },
          quadraticCurveTo(cx, cy, x, y) { path.push("Q", cx, cy, x, y); },
          bezierCurveTo(c1x, c1y, c2x, c2y, x, y) { path.push("C", c1x, c1y, c2x, c2y, x, y); },
          arc(x, y, r, a0, a1, ccw = false) { path.push("A", x, y, r, a0, a1, ccw ? 1 : 0); },
          ellipse(x, y, rx, ry) { path.push("E", x - rx, y - ry, rx * 2, ry * 2); },
          rect(x, y, w, h) { path.push("R", x, y, w, h); },
          roundRect(x, y, w, h, r = 0) { path.push("RR", x, y, w, h, typeof r === "number" ? r : r?.[0] ?? 0); },
          circle(x, y, r) { path.push("E", x - r, y - r, r * 2, r * 2); },
          closePath() { path.push("Z"); },
          fill(s) { commands.push(["fill", path.slice(), style(s ?? state.fillStyle), state.globalAlpha, fx()]); },
          stroke(s) {
            commands.push(["stroke", path.slice(), style(s ?? state.strokeStyle), state.globalAlpha, state.lineWidth, state.lineCap, state.lineJoin, state.dash.slice(), fx()]);
          },
          clip() { commands.push(["clip", path.slice()]); },
          fillRect(x, y, w, h) { commands.push(["fill", ["R", x, y, w, h], style(state.fillStyle), state.globalAlpha, fx()]); },
          strokeRect(x, y, w, h) {
            commands.push(["stroke", ["R", x, y, w, h], style(state.strokeStyle), state.globalAlpha, state.lineWidth, state.lineCap, state.lineJoin, state.dash.slice(), fx()]);
          },
          clearRect(x, y, w, h) { commands.push(["clear", x, y, w, h]); },
          fillText(text, x, y) {
            commands.push(["text", String(text), x, y, style(state.fillStyle), state.globalAlpha, state.font, state.fontWeight, state.textAlign, state.textBaseline, fx()]);
          },
          /** `{ width, height }` of a line of text in the current font. */
          measureText(text) {
            return __host.measureText(String(text), state.font, state.fontWeight);
          },
          /**
           * An image URL (drawn once loaded; the canvas draws again then) or an
           * SF Symbol name (tinted with fillStyle), in a rect.
           */
          drawImage(source, x, y, w, h) {
            const name = String(source);
            if (isURL(name)) commands.push(["image", name, x, y, w, h, state.globalAlpha, fx()]);
            else commands.push(["symbol", name, x, y, w, h, style(state.fillStyle), state.globalAlpha, fx()]);
          },
          setLineDash(d) { state.dash = d ?? []; },
          save() { stack.push({ ...state, dash: state.dash.slice() }); commands.push(["save"]); },
          restore() { if (stack.length) Object.assign(state, stack.pop()); commands.push(["restore"]); },
          translate(x, y) { commands.push(["transform", 1, 0, 0, 1, x, y]); },
          rotate(a) { const c = Math.cos(a), s = Math.sin(a); commands.push(["transform", c, s, -s, c, 0, 0]); },
          scale(x, y = x) { commands.push(["transform", x, 0, 0, y, 0, 0]); },
          transform(a, b, c, d, e, f) { commands.push(["transform", a, b, c, d, e, f]); },
          createLinearGradient(x0, y0, x1, y1) {
            const g = { type: "linear", points: [x0, y0, x1, y1], stops: [] };
            return { __gradient: g, addColorStop(offset, color) { g.stops.push([offset, color]); } };
          },
          createRadialGradient(x0, y0, r0, x1, y1, r1) {
            const g = { type: "radial", points: [x1, y1, r0, r1], stops: [] };
            return { __gradient: g, addColorStop(offset, color) { g.stops.push([offset, color]); } };
          },
        };
        for (const key of ["fillStyle", "strokeStyle", "lineWidth", "lineCap", "lineJoin", "globalAlpha", "textAlign", "textBaseline",
          "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "globalCompositeOperation"]) {
          Object.defineProperty(ctx, key, { get: () => state[key], set: (v) => { state[key] = v; }, enumerable: true });
        }
        // "bold 16px", 16, or { size, weight }.
        Object.defineProperty(ctx, "font", {
          get: () => `${state.fontWeight} ${state.font}px`,
          set: (v) => {
            if (typeof v === "number") state.font = v;
            else if (v && typeof v === "object") { state.font = v.size ?? state.font; state.fontWeight = v.weight ?? state.fontWeight; }
            else {
              const size = /(\d+(?:\.\d+)?)px/.exec(String(v));
              if (size) state.font = Number(size[1]);
              const weight = /\b(ultraLight|thin|light|regular|medium|semibold|bold|heavy|black|\d00)\b/.exec(String(v));
              if (weight) state.fontWeight = weight[1];
            }
          },
        });
        return ctx;
      }

      return {
        compile,
        setStyle(node, w) {
          const st = styles.get(node);
          if (st) for (const id of st.deps) shared.get(id)?.styles.delete(node);
          styles.set(node, { fn: compile(w.__worklet), deps: new Set() });
          return evaluate(node);
        },
        removeStyle,
        /** The commands for a canvas, recording which shared values it read. */
        draw(node, w, width, height, time) {
          let c = canvases.get(node);
          const key = JSON.stringify(w);
          if (!c || c.key !== key) {
            c = { key, fn: compile(w.__worklet), deps: new Set() };
            canvases.set(node, c);
          }
          const ctx = context();
          tracked(c.deps, () => c.fn(ctx, { width, height }, time));
          return ctx.commands;
        },
        message(m) {
          switch (m.type) {
            case "delete":
              cancel(m.id);
              shared.delete(m.id);
              derived.delete(m.id);
              break;
            case "derive":
              derived.set(m.id, { fn: compile(m.worklet.__worklet), deps: new Set() });
              runDerived(m.id);
              break;
            case "react":
              reactions.set(m.id, { prepare: compile(m.prepare.__worklet), react: compile(m.react.__worklet), deps: new Set(), started: false });
              runReaction(m.id);
              break;
            case "unreact":
              reactions.delete(m.id);
              break;
            case "cancel":
              cancel(m.id);
              break;
            case "scroll": {
              // Written every frame of a scroll: the JS thread hears it ~10 times a second.
              cancel(m.id);
              assign(m.id, m.value, null, false);
              const now = Date.now();
              if (m.final || now - (scrollSyncs.get(m.id) ?? 0) > 100) {
                scrollSyncs.set(m.id, now);
                toJS.set(m.id, m.value);
              }
              break;
            }
            default:
              set(m.id, hydrate(m.value), false);
          }
        },
        frame,
        // Styles whose shared values changed, re-evaluated. Values changed with
        // different SwiftUI animations are applied in steps, one animation each
        // (only that group's values new so far), so a spring on one value and a
        // timing curve on another both keep their own curve. Unanimated
        // changes (including every frame of the engine's own animations) go last.
        flush() {
          propagate();
          for (const callback of finished.splice(0)) callback();
          propagate();
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
          const redraw = [];
          for (const [node, c] of canvases) {
            for (const id of c.deps) if (changed.has(id)) { redraw.push(node); break; }
          }
          changed.clear();
          const values = {};
          for (const [id, v] of toJS) values[id] = v;
          toJS.clear();
          return { styles: out, values, calls: calls.splice(0), canvases: redraw, animating: running.size > 0 };
        },
      };
    })()
    """#
}
