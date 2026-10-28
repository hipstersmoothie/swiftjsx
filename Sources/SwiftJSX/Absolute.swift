import SwiftUI

/// `<AbsoluteStack>`: children placed by their `position` prop, as layout
/// (not a transform): `{ x, y, width, height, anchor }`, each in points or a
/// fraction of the stack ("25%"). A transition scales a child around its own
/// frame, and a changed position animates like any layout change. Children
/// without `position` sit at the top-leading corner. The stack fills the
/// space it's offered (give it a frame inside scroll views).
struct AbsoluteLayout: Layout {
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        proposal.replacingUnspecifiedDimensions()
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for subview in subviews {
            let spec = subview[AbsolutePosition.self] ?? PositionSpec()
            let width = spec.width?.resolve(in: bounds.width)
            let height = spec.height?.resolve(in: bounds.height)
            let x = spec.x?.resolve(in: bounds.width) ?? 0
            let y = spec.y?.resolve(in: bounds.height) ?? 0
            subview.place(at: CGPoint(x: bounds.minX + x, y: bounds.minY + y), anchor: spec.anchor,
                          proposal: ProposedViewSize(width: width, height: height))
        }
    }
}

struct AbsolutePosition: LayoutValueKey {
    static let defaultValue: PositionSpec? = nil
}

struct PositionSpec: Equatable {
    /// Points, or a fraction of the stack's size.
    enum Length: Equatable {
        case points(CGFloat), fraction(CGFloat)
        func resolve(in total: CGFloat) -> CGFloat {
            switch self {
            case .points(let p): p
            case .fraction(let f): f * total
            }
        }
        init?(_ value: Any?) {
            if let n = value as? NSNumber {
                self = .points(CGFloat(n.doubleValue))
            } else if let s = value as? String, s.hasSuffix("%"), let n = Double(s.dropLast()) {
                self = .fraction(CGFloat(n / 100))
            } else {
                return nil
            }
        }
    }

    var x: Length?, y: Length?, width: Length?, height: Length?
    var anchor: UnitPoint = .topLeading

    init() {}
    init?(_ value: Any?) {
        guard let dict = value as? [String: Any] else { return nil }
        x = Length(dict["x"])
        y = Length(dict["y"])
        width = Length(dict["width"])
        height = Length(dict["height"])
        anchor = unitPoint(dict["anchor"] as? String) ?? .topLeading
    }
}
