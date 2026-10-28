import SwiftUI

// Gesture, transform and accessibility props. Like `onTapGesture`, each group
// is attached the first time one of its props is used and then stays (see
// `Node.features`); with its prop unset it's a no-op, so the view keeps its
// identity.

/// `offset`, `scale`, `rotation`: applied after the box (background, border,
/// shadow), like a CSS transform.
/// `scale` (or `scaleX` / `scaleY`), `rotation`, `rotation3D` (`{ degrees,
/// axis: { x, y, z }, perspective }`: card flips) and `offset`, around
/// `transformAnchor` (default center).
struct TransformModifier: ViewModifier {
    let node: Node
    func body(content: Content) -> some View {
        if node.features.contains(.transform) {
            let offset = node.dict("offset")
            let anchor = unitPoint(node.string("transformAnchor")) ?? .center
            let scale = node.cgFloat("scale") ?? 1
            let flip = node.dict("rotation3D")
            let axis = flip?["axis"] as? [String: Any]
            content
                .scaleEffect(x: scale * (node.cgFloat("scaleX") ?? 1), y: scale * (node.cgFloat("scaleY") ?? 1), anchor: anchor)
                .rotationEffect(.degrees(node.double("rotation") ?? 0), anchor: anchor)
                .rotation3DEffect(.degrees((flip?["degrees"] as? NSNumber)?.doubleValue ?? 0),
                                  axis: (x: cgFloat(axis?["x"]) ?? 0, y: cgFloat(axis?["y"]) ?? 1, z: cgFloat(axis?["z"]) ?? 0),
                                  anchor: anchor, perspective: cgFloat(flip?["perspective"]) ?? 1)
                .offset(x: cgFloat(offset?["x"]) ?? 0, y: cgFloat(offset?["y"]) ?? 0)
        } else {
            content
        }
    }
}

/// `keyframes={{ trigger, steps, repeat }}`: plays `steps` in order (each a
/// scale, opacity, x / y offset and rotation, with its `animation` or
/// `duration`) whenever `trigger` changes, then settles back; `repeat` loops.
/// A pop: `[{ scale: 1.25 }, { scale: 1 }]`; a shake: `[{ x: -8 }, { x: 8 }, { x: -4 }, { x: 0 }]`.
struct KeyframesModifier: ViewModifier {
    let node: Node

    struct Step: Equatable {
        var scale = 1.0, opacity = 1.0, x = 0.0, y = 0.0, rotation = 0.0
        init() {}
        init(_ dict: [String: Any]) {
            func number(_ key: String) -> Double? { (dict[key] as? NSNumber)?.doubleValue }
            scale = number("scale") ?? 1
            opacity = number("opacity") ?? 1
            x = number("x") ?? 0
            y = number("y") ?? 0
            rotation = number("rotation") ?? 0
        }
    }

    func body(content: Content) -> some View {
        if node.features.contains(.keyframes), let spec = node.dict("keyframes") {
            let raw = (spec["steps"] as? [[String: Any]]) ?? []
            let steps = [Step()] + raw.map(Step.init)
            let animations: [Animation] = [parseAnimation(spec["settle"]) ?? .spring(duration: 0.3)] + raw.map { step in
                parseAnimation(step["animation"]) ?? .easeInOut(duration: (step["duration"] as? NSNumber)?.doubleValue ?? 0.12)
            }
            if spec["repeat"] as? Bool == true {
                content.phaseAnimator(Array(steps.indices)) { view, phase in
                    apply(view, steps[phase])
                } animation: { animations[$0] }
            } else {
                content.phaseAnimator(Array(steps.indices), trigger: trigger(spec["trigger"])) { view, phase in
                    apply(view, steps[phase])
                } animation: { animations[$0] }
            }
        } else {
            content
        }
    }

    private func apply<V: View>(_ view: V, _ step: Step) -> some View {
        view
            .scaleEffect(step.scale)
            .opacity(step.opacity)
            .rotationEffect(.degrees(step.rotation))
            .offset(x: step.x, y: step.y)
    }

    private func trigger(_ value: Any?) -> String {
        guard let value, !(value is NSNull) else { return "" }
        if let data = try? JSONSerialization.data(withJSONObject: [value]), let text = String(data: data, encoding: .utf8) { return text }
        return "\(value)"
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
    /// …and the current drag: started, ended normally (to tell a cancel
    /// apart), its last event. A reference, so updating it doesn't re-render.
    @State private var drag = Box()

    final class Box {
        var started = false
        var ended = false
        var event: [String: Any] = [:]
    }

    func body(content: Content) -> some View {
        content
            .modifier(FrameReader(enabled: node.features.contains(.drag), frame: $frame))
            .modifier(Attach(node: node, feature: .doubleTap, enabled: node.has("onDoubleTap"),
                             gesture: TapGesture(count: 2).onEnded { fire("onDoubleTap") }))
            // Buttons handle their own long press (ButtonHost).
            .modifier(Attach(node: node, feature: .longPress, enabled: node.has("onLongPress") && node.type != "Button",
                             gesture: LongPressGesture(minimumDuration: node.double("longPressDuration") ?? 0.5)
                                 .onEnded { _ in fire("onLongPress") }))
            .modifier(dragAttachment)
            // A drag the system cancelled (another gesture won, a sheet appeared…)
            // never ends normally; report it so drag state doesn't get stuck.
            // Checked a turn later: SwiftUI doesn't promise whether the reset
            // comes before or after onEnded.
            .onChange(of: dragging) { _, isDragging in
                guard !isDragging else { return }
                let current = drag
                DispatchQueue.main.async {
                    MainActor.assumeIsolated {
                        guard current.started, !current.ended else { return }
                        current.started = false
                        fire("onDragEnd", current.event.merging(["cancelled": true]) { $1 })
                    }
                }
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
                let event = dragEvent(value)
                if !drag.started {
                    drag.started = true
                    drag.ended = false
                    // With dragActivation="longPress", onDragStart fired when the hold did.
                    if node.string("dragActivation") != "longPress" { fire("onDragStart", event) }
                }
                drag.event = event
                fire("onDrag", event)
            }
            .onEnded { value in
                drag.ended = true
                drag.started = false
                fire("onDragEnd", dragEvent(value))
            }
    }

    /// `dragActivation="longPress"`: hold first (`longPressDuration`), then
    /// drag. Inside a ScrollView, scrolling still works until the hold.
    private var dragAttachment: some ViewModifier {
        let enabled = node.has("onDrag") || node.has("onDragEnd") || node.has("onDragStart")
        let priority = node.string("gesturePriority")
        #if os(iOS)
        // `dragAxis`: a UIKit pan that only starts along its axis, so the
        // other direction still scrolls the surrounding ScrollView.
        if let axis = node.string("dragAxis"), node.features.contains(.drag) {
            return AnyViewModifier(AxisDrag(node: node, horizontal: axis == "horizontal", frame: frame, fire: fire))
        }
        #endif
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

    private func dragEvent(_ value: DragGesture.Value) -> [String: Any] {
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

/// `onKeyPress({ key, characters, modifiers })`: hardware keyboard keys while
/// the view (or something inside it) has focus; it takes focus when it
/// appears. `keys` limits which keys it takes (the rest pass on). Key names
/// follow the web: "ArrowUp", "Enter", "Escape", "Backspace", "Tab", " ", "a"…
struct KeyPressModifier: ViewModifier {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @FocusState private var focused: Bool

    func body(content: Content) -> some View {
        // Text fields handle their own keys (FieldKeys): no .focusable() on them.
        if node.features.contains(.keyPress), node.type != "TextField", node.type != "TextEditor" {
            content
                .focusable()
                .focusEffectDisabled()
                .focused($focused)
                .onAppear { focused = true }
                .onKeyPress(phases: .down) { press in
                    let key = Self.name(press)
                    if let keys = node.prop("keys") as? [String], !keys.contains(key) { return .ignored }
                    guard node.has("onKeyPress") else { return .ignored }
                    runtime?.fire(node, "onKeyPress", [
                        "key": key, "characters": press.characters,
                        "modifiers": Self.modifiers(press.modifiers),
                    ])
                    return .handled
                }
        } else {
            content
        }
    }

    static func name(_ press: KeyPress) -> String {
        switch press.key {
        case .upArrow: "ArrowUp"
        case .downArrow: "ArrowDown"
        case .leftArrow: "ArrowLeft"
        case .rightArrow: "ArrowRight"
        case .return: "Enter"
        case .escape: "Escape"
        case .delete: "Backspace"
        case .deleteForward: "Delete"
        case .tab: "Tab"
        case .space: " "
        case .home: "Home"
        case .end: "End"
        case .pageUp: "PageUp"
        case .pageDown: "PageDown"
        default: press.characters
        }
    }

    static func modifiers(_ flags: EventModifiers) -> [String] {
        var names: [String] = []
        if flags.contains(.command) { names.append("command") }
        if flags.contains(.shift) { names.append("shift") }
        if flags.contains(.option) { names.append("option") }
        if flags.contains(.control) { names.append("control") }
        return names
    }
}

/// `keyboardShortcut` on a Button: "k" (with ⌘), or `{ key, modifiers }`.
/// Keys: a character, or "Enter" / "Escape" / "ArrowUp"…, or "default" /
/// "cancel" (Return and Escape in dialogs).
struct KeyboardShortcutModifier: ViewModifier {
    let spec: Any?

    func body(content: Content) -> some View {
        if let shortcut {
            content.keyboardShortcut(shortcut)
        } else {
            content
        }
    }

    private var shortcut: KeyboardShortcut? {
        let dict = spec as? [String: Any]
        guard let key = (spec as? String) ?? (dict?["key"] as? String) else { return nil }
        if key == "default" { return .defaultAction }
        if key == "cancel" { return .cancelAction }
        let equivalent: KeyEquivalent? = switch key {
        case "Enter": .return
        case "Escape": .escape
        case "ArrowUp": .upArrow
        case "ArrowDown": .downArrow
        case "ArrowLeft": .leftArrow
        case "ArrowRight": .rightArrow
        case "Backspace": .delete
        case "Tab": .tab
        case " ": .space
        default: key.count == 1 ? KeyEquivalent(Character(key)) : nil
        }
        guard let equivalent else { return nil }
        guard let names = dict?["modifiers"] as? [String] else { return KeyboardShortcut(equivalent) }
        var flags: EventModifiers = []
        for name in names {
            switch name {
            case "command": flags.insert(.command)
            case "shift": flags.insert(.shift)
            case "option": flags.insert(.option)
            case "control": flags.insert(.control)
            default: break
            }
        }
        return KeyboardShortcut(equivalent, modifiers: flags)
    }
}

#if os(iOS)
/// `dragAxis="horizontal" | "vertical"`: drag events (same shape as a
/// SwiftUI drag's) from a pan that begins only when the movement is along the
/// axis. A ScrollView's own pan waits for it to fail, so a vertical swipe on a
/// horizontally draggable card still scrolls the list.
private struct AxisDrag: ViewModifier {
    let node: Node
    let horizontal: Bool
    let frame: CGRect
    let fire: (String, Any?) -> Void

    func body(content: Content) -> some View {
        content.gesture(AxisPan(horizontal: horizontal) { phase, event in
            var payload = event
            func local(_ p: [String: Double]) -> [String: Double] { ["x": (p["x"] ?? 0) - frame.minX, "y": (p["y"] ?? 0) - frame.minY] }
            if let location = event["location"] as? [String: Double] { payload["localLocation"] = local(location) }
            if let start = event["startLocation"] as? [String: Double] { payload["localStartLocation"] = local(start) }
            payload["size"] = ["width": frame.width, "height": frame.height]
            switch phase {
            case .began:
                fire("onDragStart", payload)
                fire("onDrag", payload)
            case .changed:
                fire("onDrag", payload)
            case .ended:
                fire("onDragEnd", payload)
            default:
                fire("onDragEnd", payload.merging(["cancelled": true]) { $1 })
            }
        })
    }
}

struct AxisPan: UIGestureRecognizerRepresentable {
    let horizontal: Bool
    let onEvent: (UIGestureRecognizer.State, [String: Any]) -> Void

    func makeUIGestureRecognizer(context: Context) -> UIPanGestureRecognizer {
        let pan = UIPanGestureRecognizer()
        pan.delegate = context.coordinator
        return pan
    }

    func updateUIGestureRecognizer(_ recognizer: UIPanGestureRecognizer, context: Context) {
        context.coordinator.horizontal = horizontal
    }

    func makeCoordinator(converter: CoordinateSpaceConverter) -> Coordinator {
        Coordinator(horizontal: horizontal)
    }

    func handleUIGestureRecognizerAction(_ recognizer: UIPanGestureRecognizer, context: Context) {
        let window = recognizer.view?.window
        let translation = recognizer.translation(in: window)
        let velocity = recognizer.velocity(in: window)
        let location = recognizer.location(in: window)
        if recognizer.state == .began {
            context.coordinator.start = CGPoint(x: location.x - translation.x, y: location.y - translation.y)
        }
        let start = context.coordinator.start
        func point(_ p: CGPoint) -> [String: Double] { ["x": p.x, "y": p.y] }
        // About where a fling would come to rest (like DragGesture's prediction).
        let predicted = CGPoint(x: translation.x + velocity.x * 0.25, y: translation.y + velocity.y * 0.25)
        onEvent(recognizer.state, [
            "translation": point(translation),
            "location": point(location),
            "startLocation": point(start),
            "velocity": point(velocity),
            "predictedEndTranslation": point(predicted),
        ])
    }

    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        var horizontal: Bool
        var start: CGPoint = .zero
        init(horizontal: Bool) { self.horizontal = horizontal }

        /// Only along the axis; otherwise fail at once and let scrolling happen.
        func gestureRecognizerShouldBegin(_ recognizer: UIGestureRecognizer) -> Bool {
            guard let pan = recognizer as? UIPanGestureRecognizer else { return true }
            let v = pan.velocity(in: pan.view)
            return horizontal ? abs(v.x) > abs(v.y) : abs(v.y) > abs(v.x)
        }

        /// Scroll views' pans wait for this one to fail.
        func gestureRecognizer(_ recognizer: UIGestureRecognizer,
                               shouldBeRequiredToFailBy other: UIGestureRecognizer) -> Bool {
            other.view is UIScrollView && other is UIPanGestureRecognizer
        }
    }
}
#endif
