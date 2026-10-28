import SwiftUI

/// `<Path d viewBox>` and `<Polyline points viewBox>`: SVG-style shapes in a
/// coordinate box (`viewBox: [x, y, width, height]`, default 0 0 100 100)
/// stretched to the frame (or fitted, with `preserveAspectRatio="fit"`).
struct PathShape: Shape {
    var path: Path
    var viewBox: CGRect
    var fit: Bool

    func path(in rect: CGRect) -> Path {
        guard viewBox.width > 0, viewBox.height > 0 else { return Path() }
        var sx = rect.width / viewBox.width, sy = rect.height / viewBox.height
        var dx = rect.minX, dy = rect.minY
        if fit {
            let s = min(sx, sy)
            dx += (rect.width - viewBox.width * s) / 2
            dy += (rect.height - viewBox.height * s) / 2
            sx = s
            sy = s
        }
        let transform = CGAffineTransform(translationX: -viewBox.minX, y: -viewBox.minY)
            .concatenating(CGAffineTransform(scaleX: sx, y: sy))
            .concatenating(CGAffineTransform(translationX: dx, y: dy))
        return path.applying(transform)
    }
}

extension PathShape {
    @MainActor
    init(node: Node) {
        let box = (node.prop("viewBox") as? [NSNumber])?.map { CGFloat($0.doubleValue) }
        viewBox = box?.count == 4 ? CGRect(x: box![0], y: box![1], width: box![2], height: box![3]) : CGRect(x: 0, y: 0, width: 100, height: 100)
        fit = node.string("preserveAspectRatio") == "fit"
        if node.type == "Polyline" {
            let points = (node.prop("points") as? [Any] ?? []).compactMap { item -> CGPoint? in
                guard let pair = item as? [NSNumber], pair.count == 2 else { return nil }
                return CGPoint(x: pair[0].doubleValue, y: pair[1].doubleValue)
            }
            var p = Path()
            if let first = points.first {
                p.move(to: first)
                points.dropFirst().forEach { p.addLine(to: $0) }
                if node.bool("closed") { p.closeSubpath() }
            }
            path = p
        } else {
            path = SVGPath.parse(node.string("d") ?? "")
        }
    }
}

/// SVG path data: M L H V C S Q T A Z, absolute and relative.
enum SVGPath {
    static func parse(_ d: String) -> Path {
        var path = Path()
        var tokens = tokenize(d)[...]
        var current = CGPoint.zero, start = CGPoint.zero
        var lastControl: CGPoint?
        var command: Character = "M"

        func number() -> CGFloat? {
            guard case .number(let n)? = tokens.first else { return nil }
            tokens.removeFirst()
            return n
        }
        func point(_ relative: Bool) -> CGPoint? {
            guard let x = number(), let y = number() else { return nil }
            return relative ? CGPoint(x: current.x + x, y: current.y + y) : CGPoint(x: x, y: y)
        }

        while let token = tokens.first {
            if case .command(let c) = token {
                command = c
                tokens.removeFirst()
            }
            let relative = command.isLowercase
            switch command.uppercased().first! {
            case "M":
                guard let p = point(relative) else { return path }
                path.move(to: p)
                current = p
                start = p
                lastControl = nil
                command = relative ? "l" : "L"  // further pairs are lines
            case "L":
                guard let p = point(relative) else { return path }
                path.addLine(to: p)
                current = p
                lastControl = nil
            case "H":
                guard let x = number() else { return path }
                current = CGPoint(x: relative ? current.x + x : x, y: current.y)
                path.addLine(to: current)
                lastControl = nil
            case "V":
                guard let y = number() else { return path }
                current = CGPoint(x: current.x, y: relative ? current.y + y : y)
                path.addLine(to: current)
                lastControl = nil
            case "C":
                guard let c1 = point(relative), let c2 = point(relative), let p = point(relative) else { return path }
                path.addCurve(to: p, control1: c1, control2: c2)
                lastControl = c2
                current = p
            case "S":
                let c1 = lastControl.map { CGPoint(x: 2 * current.x - $0.x, y: 2 * current.y - $0.y) } ?? current
                guard let c2 = point(relative), let p = point(relative) else { return path }
                path.addCurve(to: p, control1: c1, control2: c2)
                lastControl = c2
                current = p
            case "Q":
                guard let c = point(relative), let p = point(relative) else { return path }
                path.addQuadCurve(to: p, control: c)
                lastControl = c
                current = p
            case "T":
                let c = lastControl.map { CGPoint(x: 2 * current.x - $0.x, y: 2 * current.y - $0.y) } ?? current
                guard let p = point(relative) else { return path }
                path.addQuadCurve(to: p, control: c)
                lastControl = c
                current = p
            case "A":
                guard let rx = number(), let ry = number(), let rotation = number(), let large = number(), let sweep = number(),
                      let p = point(relative) else { return path }
                addArc(&path, from: current, to: p, rx: rx, ry: ry, rotation: rotation, large: large != 0, sweep: sweep != 0)
                current = p
                lastControl = nil
            case "Z":
                path.closeSubpath()
                current = start
                lastControl = nil
            default:
                tokens.removeFirst()
            }
        }
        return path
    }

    private enum Token { case command(Character), number(CGFloat) }

    private static func tokenize(_ d: String) -> [Token] {
        var tokens: [Token] = []
        var number = ""
        func flush() {
            if let n = Double(number) { tokens.append(.number(CGFloat(n))) }
            number = ""
        }
        for char in d {
            if char.isLetter, char != "e", char != "E" {
                flush()
                tokens.append(.command(char))
            } else if char == "-" || char == "+" {
                // A sign starts a new number unless it follows an exponent.
                if let last = number.last, last == "e" || last == "E" { number.append(char) } else { flush(); number.append(char) }
            } else if char == "." && number.contains(".") && !number.contains("e") {
                flush()
                number.append(char)
            } else if char.isNumber || char == "." || char == "e" || char == "E" {
                number.append(char)
            } else {
                flush()
            }
        }
        flush()
        return tokens
    }

    /// SVG endpoint arc → center arc (SVG spec, appendix F.6), drawn with curves.
    private static func addArc(_ path: inout Path, from p0: CGPoint, to p1: CGPoint, rx: CGFloat, ry: CGFloat,
                               rotation: CGFloat, large: Bool, sweep: Bool) {
        var rx = abs(rx), ry = abs(ry)
        guard rx > 0, ry > 0, p0 != p1 else { return path.addLine(to: p1) }
        let phi = rotation * .pi / 180
        let cosPhi = cos(phi), sinPhi = sin(phi)
        let dx = (p0.x - p1.x) / 2, dy = (p0.y - p1.y) / 2
        let x1 = cosPhi * dx + sinPhi * dy, y1 = -sinPhi * dx + cosPhi * dy
        let lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)
        if lambda > 1 { rx *= sqrt(lambda); ry *= sqrt(lambda) }
        let num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
        let den = rx * rx * y1 * y1 + ry * ry * x1 * x1
        let coef = (large != sweep ? 1 : -1) * sqrt(max(0, num / den))
        let cx1 = coef * rx * y1 / ry, cy1 = -coef * ry * x1 / rx
        let center = CGPoint(x: cosPhi * cx1 - sinPhi * cy1 + (p0.x + p1.x) / 2, y: sinPhi * cx1 + cosPhi * cy1 + (p0.y + p1.y) / 2)
        func angle(_ ux: CGFloat, _ uy: CGFloat, _ vx: CGFloat, _ vy: CGFloat) -> CGFloat {
            let a = atan2(ux * vy - uy * vx, ux * vx + uy * vy)
            return a
        }
        let theta1 = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry)
        var delta = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry)
        if !sweep, delta > 0 { delta -= 2 * .pi } else if sweep, delta < 0 { delta += 2 * .pi }
        // Approximate with line segments fine enough to look smooth.
        let steps = max(8, Int(abs(delta) / (.pi / 32)))
        for i in 1...steps {
            let t = theta1 + delta * CGFloat(i) / CGFloat(steps)
            let x = rx * cos(t), y = ry * sin(t)
            path.addLine(to: CGPoint(x: center.x + cosPhi * x - sinPhi * y, y: center.y + sinPhi * x + cosPhi * y))
        }
    }
}
