import SwiftUI

/// `<Canvas draw={(ctx, size, time) => …}>`: immediate-mode drawing. `draw`
/// is a worklet: it runs on the main thread inside SwiftUI's Canvas,
/// recording 2D-context calls (`ctx.fillRect`, `ctx.arc`, `ctx.fillText`…)
/// that are replayed here into the GraphicsContext. It draws again when its
/// size changes, when shared values it read change (so animations drive it),
/// and every frame with `continuous` (`time` is seconds since it appeared).
struct CanvasHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @State private var appeared = Date()

    var body: some View {
        let version = node.canvasVersion
        if node.bool("continuous") {
            TimelineView(.animation) { timeline in
                canvas(version: version, time: timeline.date.timeIntervalSince(appeared))
            }
        } else {
            canvas(version: version, time: 0)
        }
    }

    private func canvas(version: Int, time: Double) -> some View {
        Canvas { context, size in
            MainActor.assumeIsolated {
                _ = version
                guard let commands = runtime?.worklets.draw(node, size: size, time: time) else { return }
                var replay = CanvasReplay(context: context)
                replay.run(commands)
            }
        }
    }
}

/// Replays recorded canvas commands (see `context()` in WorkletPrelude).
@MainActor
struct CanvasReplay {
    var context: GraphicsContext
    private var saved: [GraphicsContext] = []

    init(context: GraphicsContext) {
        self.context = context
    }

    mutating func run(_ commands: [Any]) {
        for case let command as [Any] in commands {
            guard let name = command.first as? String else { continue }
            let args = Array(command.dropFirst())
            func number(_ i: Int) -> CGFloat { i < args.count ? CGFloat((args[i] as? NSNumber)?.doubleValue ?? 0) : 0 }
            func string(_ i: Int) -> String? { i < args.count ? args[i] as? String : nil }
            switch name {
            case "fill":
                var target = context
                target.opacity *= Double(number(2))
                target.fill(Self.path(args.first), with: shading(args[safe: 1]))
            case "stroke":
                var target = context
                target.opacity *= Double(number(2))
                let dash = (args[safe: 6] as? [Any] ?? []).compactMap { ($0 as? NSNumber).map { CGFloat($0.doubleValue) } }
                let style = StrokeStyle(lineWidth: number(3), lineCap: lineCap(string(4)), lineJoin: lineJoin(string(5)), dash: dash)
                target.stroke(Self.path(args.first), with: shading(args[safe: 1]), style: style)
            case "clip":
                context.clip(to: Self.path(args.first))
            case "clear":
                var target = context
                target.blendMode = .clear
                target.fill(Path(CGRect(x: number(0), y: number(1), width: number(2), height: number(3))), with: .color(.black))
            case "text":
                var target = context
                target.opacity *= Double(number(4))
                let weight = fontWeight(string(6) ?? "regular") ?? .regular
                let text = Text(string(0) ?? "").font(.system(size: number(5), weight: weight))
                let resolved = target.resolve(text.foregroundStyle(color(args[safe: 3]) ?? .primary))
                target.draw(resolved, at: CGPoint(x: number(1), y: number(2)), anchor: anchor(align: string(7), baseline: string(8)))
            case "symbol":
                var target = context
                target.opacity *= Double(number(6))
                let rect = CGRect(x: number(1), y: number(2), width: number(3), height: number(4))
                let image = Image(systemName: string(0) ?? "questionmark").resizable()
                var resolved = target.resolve(image)
                resolved.shading = shading(args[safe: 5])
                target.draw(resolved, in: rect)
            case "save":
                saved.append(context)
            case "restore":
                if let last = saved.popLast() { context = last }
            case "transform":
                context.concatenate(CGAffineTransform(a: number(0), b: number(1), c: number(2), d: number(3), tx: number(4), ty: number(5)))
            default:
                continue
            }
        }
    }

    /// Flat path data: "M" x y, "L" x y, "Q" cx cy x y, "C" …, "A" x y r a0 a1 ccw,
    /// "E" x y w h (ellipse in a rect), "R" x y w h, "RR" x y w h r, "Z".
    static func path(_ value: Any?) -> Path {
        let items = value as? [Any] ?? []
        var path = Path()
        var i = 0
        func n() -> CGFloat {
            defer { i += 1 }
            return i < items.count ? CGFloat((items[i] as? NSNumber)?.doubleValue ?? 0) : 0
        }
        while i < items.count {
            guard let op = items[i] as? String else { i += 1; continue }
            i += 1
            switch op {
            case "M": path.move(to: CGPoint(x: n(), y: n()))
            case "L":
                let p = CGPoint(x: n(), y: n())
                if path.isEmpty { path.move(to: p) } else { path.addLine(to: p) }
            case "Q":
                let c = CGPoint(x: n(), y: n()), p = CGPoint(x: n(), y: n())
                path.addQuadCurve(to: p, control: c)
            case "C":
                let c1 = CGPoint(x: n(), y: n()), c2 = CGPoint(x: n(), y: n()), p = CGPoint(x: n(), y: n())
                path.addCurve(to: p, control1: c1, control2: c2)
            case "A":
                let center = CGPoint(x: n(), y: n()), r = n(), a0 = n(), a1 = n(), ccw = n() != 0
                // Canvas angles are clockwise on screen (y down), like SwiftUI's `clockwise: false`.
                path.addArc(center: center, radius: r, startAngle: .radians(a0), endAngle: .radians(a1), clockwise: ccw)
            case "E": path.addEllipse(in: CGRect(x: n(), y: n(), width: n(), height: n()))
            case "R": path.addRect(CGRect(x: n(), y: n(), width: n(), height: n()))
            case "RR":
                let rect = CGRect(x: n(), y: n(), width: n(), height: n())
                let r = n()
                path.addRoundedRect(in: rect, cornerSize: CGSize(width: r, height: r), style: .continuous)
            case "Z": path.closeSubpath()
            default: continue
            }
        }
        return path
    }

    private func shading(_ value: Any?) -> GraphicsContext.Shading {
        if let spec = value as? [String: Any], let gradient = spec["gradient"] as? [String: Any] {
            let stops = (gradient["stops"] as? [Any] ?? []).compactMap { item -> Gradient.Stop? in
                guard let pair = item as? [Any], pair.count == 2, let offset = pair[0] as? NSNumber, let c = color(pair[1]) else { return nil }
                return Gradient.Stop(color: c, location: offset.doubleValue)
            }
            let p = (gradient["points"] as? [NSNumber] ?? []).map { CGFloat($0.doubleValue) }
            let g = Gradient(stops: stops)
            if gradient["type"] as? String == "radial", p.count == 4 {
                return .radialGradient(g, center: CGPoint(x: p[0], y: p[1]), startRadius: p[2], endRadius: p[3])
            }
            if p.count == 4 { return .linearGradient(g, startPoint: CGPoint(x: p[0], y: p[1]), endPoint: CGPoint(x: p[2], y: p[3])) }
        }
        return .color(color(value) ?? .primary)
    }

    private func lineCap(_ name: String?) -> CGLineCap {
        switch name {
        case "round": .round
        case "square": .square
        default: .butt
        }
    }

    private func lineJoin(_ name: String?) -> CGLineJoin {
        switch name {
        case "round": .round
        case "bevel": .bevel
        default: .miter
        }
    }

    /// textAlign (start/left, center, end/right) and textBaseline (top,
    /// middle, alphabetic/bottom) as the anchor the text is drawn at.
    private func anchor(align: String?, baseline: String?) -> UnitPoint {
        let x: CGFloat = switch align {
        case "center": 0.5
        case "end", "right": 1
        default: 0
        }
        let y: CGFloat = switch baseline {
        case "top", "hanging": 0
        case "middle": 0.5
        default: 1
        }
        return UnitPoint(x: x, y: y)
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? { indices.contains(index) ? self[index] : nil }
}
