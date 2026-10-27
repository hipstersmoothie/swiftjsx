import SwiftUI

// Gesture, transform and accessibility props. Like `onTapGesture`, each group
// is attached the first time one of its props is used and then stays (see
// `Node.features`); with its prop unset it's a no-op, so the view keeps its
// identity.

/// `offset`, `scale`, `rotation`: applied after the box (background, border,
/// shadow), like a CSS transform.
struct TransformModifier: ViewModifier {
    let node: Node
    func body(content: Content) -> some View {
        if node.features.contains(.transform) {
            let offset = node.dict("offset")
            content
                .scaleEffect(node.cgFloat("scale") ?? 1)
                .rotationEffect(.degrees(node.double("rotation") ?? 0))
                .offset(x: cgFloat(offset?["x"]) ?? 0, y: cgFloat(offset?["y"]) ?? 0)
        } else {
            content
        }
    }
}

/// `onDoubleTap`, `onLongPress`, `onDrag`/`onDragEnd`, `onMagnify`/`onMagnifyEnd`,
/// `onRotate`/`onRotateEnd`. Drags report positions in window coordinates, so
/// moving the view (with `offset`) doesn't feed back into the translation.
struct GestureModifiers: ViewModifier {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime

    func body(content: Content) -> some View {
        content
            .modifier(Attach(node: node, feature: .doubleTap, enabled: node.has("onDoubleTap"),
                             gesture: TapGesture(count: 2).onEnded { fire("onDoubleTap") }))
            .modifier(Attach(node: node, feature: .longPress, enabled: node.has("onLongPress"),
                             gesture: LongPressGesture(minimumDuration: node.double("longPressDuration") ?? 0.5)
                                 .onEnded { _ in fire("onLongPress") }))
            .modifier(Attach(node: node, feature: .drag, enabled: node.has("onDrag") || node.has("onDragEnd"),
                             gesture: DragGesture(minimumDistance: node.cgFloat("dragMinimumDistance") ?? 10, coordinateSpace: .global)
                                 .onChanged { fire("onDrag", drag($0)) }
                                 .onEnded { fire("onDragEnd", drag($0)) }))
            .modifier(Attach(node: node, feature: .magnify, enabled: node.has("onMagnify") || node.has("onMagnifyEnd"), simultaneous: true,
                             gesture: MagnifyGesture()
                                 .onChanged { fire("onMagnify", ["scale": $0.magnification]) }
                                 .onEnded { fire("onMagnifyEnd", ["scale": $0.magnification]) }))
            .modifier(Attach(node: node, feature: .rotate, enabled: node.has("onRotate") || node.has("onRotateEnd"), simultaneous: true,
                             gesture: RotateGesture()
                                 .onChanged { fire("onRotate", ["degrees": $0.rotation.degrees]) }
                                 .onEnded { fire("onRotateEnd", ["degrees": $0.rotation.degrees]) }))
    }

    private func fire(_ event: String, _ payload: Any? = nil) {
        if node.has(event) { runtime?.fire(node, event, payload) }
    }

    private func drag(_ value: DragGesture.Value) -> [String: Any] {
        func point(_ p: CGPoint) -> [String: Double] { ["x": p.x, "y": p.y] }
        func size(_ s: CGSize) -> [String: Double] { ["x": s.width, "y": s.height] }
        return [
            "translation": size(value.translation),
            "location": point(value.location),
            "startLocation": point(value.startLocation),
            "velocity": size(value.velocity),
            "predictedEndTranslation": size(value.predictedEndTranslation),
        ]
    }

    /// One gesture, attached once its feature is in use and disabled (subviews
    /// keep their gestures) while its handler props are unset.
    private struct Attach<G: Gesture>: ViewModifier {
        let node: Node
        let feature: Node.Feature
        let enabled: Bool
        var simultaneous = false
        let gesture: G

        func body(content: Content) -> some View {
            if !node.features.contains(feature) {
                content
            } else if simultaneous {
                content.simultaneousGesture(gesture, including: enabled ? .all : .subviews)
            } else {
                content.gesture(gesture, including: enabled ? .all : .subviews)
            }
        }
    }
}

/// `accessibilityLabel`, `accessibilityHint`, `accessibilityValue`,
/// `accessibilityHidden`, `accessibilityIdentifier`, `accessibilityTraits`,
/// `accessibilitySortPriority`, and `accessibilityElement` (how children are
/// exposed: "combine" | "ignore" | "contain").
struct AccessibilityModifier: ViewModifier {
    let node: Node

    func body(content: Content) -> some View {
        if node.features.contains(.accessibility) {
            let label = node.string("accessibilityLabel")
            let hint = node.string("accessibilityHint")
            let value = node.string("accessibilityValue")
            let identifier = node.string("accessibilityIdentifier")
            content
                .modifier(ElementModifier(node: node))
                .accessibilityLabel(Text(label ?? ""), isEnabled: label != nil)
                .accessibilityHint(Text(hint ?? ""), isEnabled: hint != nil)
                .accessibilityValue(Text(value ?? ""), isEnabled: value != nil)
                .accessibilityIdentifier(identifier ?? "", isEnabled: identifier != nil)
                .accessibilityHidden(node.bool("accessibilityHidden"), isEnabled: node.has("accessibilityHidden"))
                .accessibilityAddTraits(traits(node.prop("accessibilityTraits")))
                .accessibilitySortPriority(node.double("accessibilitySortPriority") ?? 0)
        } else {
            content
        }
    }

    private struct ElementModifier: ViewModifier {
        let node: Node
        func body(content: Content) -> some View {
            if node.features.contains(.accessibilityElement) {
                content.accessibilityElement(children: elementChildren(node.string("accessibilityElement")))
            } else {
                content
            }
        }
    }
}

private func elementChildren(_ name: String?) -> AccessibilityChildBehavior {
    switch name {
    case "combine": .combine
    case "ignore": .ignore
    default: .contain
    }
}

private func traits(_ value: Any?) -> AccessibilityTraits {
    let names = (value as? [Any])?.compactMap { $0 as? String } ?? (value as? String).map { [$0] } ?? []
    var traits: AccessibilityTraits = []
    for name in names {
        switch name {
        case "button": traits.insert(.isButton)
        case "header": traits.insert(.isHeader)
        case "link": traits.insert(.isLink)
        case "image": traits.insert(.isImage)
        case "selected": traits.insert(.isSelected)
        case "staticText": traits.insert(.isStaticText)
        case "searchField": traits.insert(.isSearchField)
        case "summaryElement": traits.insert(.isSummaryElement)
        case "updatesFrequently": traits.insert(.updatesFrequently)
        case "toggle": traits.insert(.isToggle)
        case "modal": traits.insert(.isModal)
        case "playsSound": traits.insert(.playsSound)
        case "startsMediaSession": traits.insert(.startsMediaSession)
        case "allowsDirectInteraction": traits.insert(.allowsDirectInteraction)
        default: break
        }
    }
    return traits
}

func cgFloat(_ value: Any?) -> CGFloat? {
    (value as? NSNumber).map { CGFloat($0.doubleValue) }
}
