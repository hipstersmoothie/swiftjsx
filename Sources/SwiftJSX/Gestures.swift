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
    /// The view's frame in the window, for drag positions in its own coordinates.
    @State private var frame: CGRect = .zero
    /// Whether a drag is in progress (reset by SwiftUI on cancel, too)…
    @GestureState private var dragging = false
    /// …whether it ended normally, to tell a cancel apart, and the last event
    /// (a reference, so updating it doesn't re-render).
    @State private var dragEnded = false
    @State private var lastDrag = Box()

    final class Box { var event: [String: Any] = [:] }

    func body(content: Content) -> some View {
        content
            .modifier(FrameReader(enabled: node.features.contains(.drag), frame: $frame))
            .modifier(Attach(node: node, feature: .doubleTap, enabled: node.has("onDoubleTap"),
                             gesture: TapGesture(count: 2).onEnded { fire("onDoubleTap") }))
            .modifier(Attach(node: node, feature: .longPress, enabled: node.has("onLongPress"),
                             gesture: LongPressGesture(minimumDuration: node.double("longPressDuration") ?? 0.5)
                                 .onEnded { _ in fire("onLongPress") }))
            .modifier(dragAttachment)
            // A drag the system cancelled (another gesture won, a sheet appeared…)
            // never ends normally; report it so drag state doesn't get stuck.
            .onChange(of: dragging) { _, isDragging in
                guard !isDragging else { return }
                if dragEnded { dragEnded = false } else { fire("onDragEnd", lastDrag.event.merging(["cancelled": true]) { $1 }) }
            }
            .modifier(Attach(node: node, feature: .magnify, enabled: node.has("onMagnify") || node.has("onMagnifyEnd"), simultaneous: true,
                             gesture: MagnifyGesture()
                                 .onChanged { fire("onMagnify", ["scale": $0.magnification]) }
                                 .onEnded { fire("onMagnifyEnd", ["scale": $0.magnification]) }))
            .modifier(Attach(node: node, feature: .rotate, enabled: node.has("onRotate") || node.has("onRotateEnd"), simultaneous: true,
                             gesture: RotateGesture()
                                 .onChanged { fire("onRotate", ["degrees": $0.rotation.degrees]) }
                                 .onEnded { fire("onRotateEnd", ["degrees": $0.rotation.degrees]) }))
    }

    private var dragGesture: some Gesture {
        DragGesture(minimumDistance: node.cgFloat("dragMinimumDistance") ?? 10, coordinateSpace: .global)
            .updating($dragging) { _, state, _ in state = true }
            .onChanged { value in
                let event = drag(value)
                lastDrag.event = event
                fire("onDrag", event)
            }
            .onEnded { value in
                dragEnded = true
                fire("onDragEnd", drag(value))
            }
    }

    /// `dragActivation="longPress"`: hold first (`longPressDuration`), then
    /// drag. Inside a ScrollView, scrolling still works until the hold.
    private var dragAttachment: some ViewModifier {
        let enabled = node.has("onDrag") || node.has("onDragEnd")
        let priority = node.string("gesturePriority")
        if node.string("dragActivation") == "longPress" {
            let hold = LongPressGesture(minimumDuration: node.double("longPressDuration") ?? 0.4)
                .onEnded { _ in fire("onDragStart") }
            return AnyViewModifier(Attach(node: node, feature: .drag, enabled: enabled, priority: priority,
                                          gesture: hold.sequenced(before: dragGesture)))
        }
        return AnyViewModifier(Attach(node: node, feature: .drag, enabled: enabled, priority: priority, gesture: dragGesture))
    }

    private func fire(_ event: String, _ payload: Any? = nil) {
        if node.has(event) { runtime?.fire(node, event, payload) }
    }

    private func drag(_ value: DragGesture.Value) -> [String: Any] {
        func point(_ p: CGPoint) -> [String: Double] { ["x": p.x, "y": p.y] }
        func size(_ s: CGSize) -> [String: Double] { ["x": s.width, "y": s.height] }
        func local(_ p: CGPoint) -> [String: Double] { ["x": p.x - frame.minX, "y": p.y - frame.minY] }
        return [
            "translation": size(value.translation),
            "location": point(value.location),
            "startLocation": point(value.startLocation),
            // Relative to the view's top-leading corner (scrubbing a chart).
            "localLocation": local(value.location),
            "localStartLocation": local(value.startLocation),
            "size": ["width": frame.width, "height": frame.height],
            "velocity": size(value.velocity),
            "predictedEndTranslation": size(value.predictedEndTranslation),
        ]
    }

    private struct FrameReader: ViewModifier {
        let enabled: Bool
        @Binding var frame: CGRect
        func body(content: Content) -> some View {
            if enabled {
                content.onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { frame = $0 }
            } else {
                content
            }
        }
    }

    /// One gesture, attached once its feature is in use and disabled (subviews
    /// keep their gestures) while its handler props are unset.
    /// `gesturePriority`: "simultaneous" (e.g. a drag inside a ScrollView that
    /// still lets it scroll), "high" (wins over children's gestures), or normal.
    private struct Attach<G: Gesture>: ViewModifier {
        let node: Node
        let feature: Node.Feature
        let enabled: Bool
        var simultaneous = false
        var priority: String?
        let gesture: G

        func body(content: Content) -> some View {
            let mask: GestureMask = enabled ? .all : .subviews
            if !node.features.contains(feature) {
                content
            } else if simultaneous || priority == "simultaneous" {
                content.simultaneousGesture(gesture, including: mask)
            } else if priority == "high" {
                content.highPriorityGesture(gesture, including: mask)
            } else {
                content.gesture(gesture, including: mask)
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

/// A type-erased view modifier (for choosing between gesture setups).
struct AnyViewModifier: ViewModifier {
    private let apply: (Content) -> AnyView
    init<M: ViewModifier>(_ modifier: M) { apply = { AnyView($0.modifier(modifier)) } }
    func body(content: Content) -> some View { apply(content) }
}
