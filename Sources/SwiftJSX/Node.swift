import Foundation
import Observation
import SwiftUI

/// One host instance created by React (a `<VStack>`, a `<Text>`, a raw string…).
///
/// Nodes are `@Observable`, so a SwiftUI view that renders a node only
/// re-evaluates when *that* node's props or children change — React decides
/// what changed, SwiftUI only redraws what was touched.
@MainActor @Observable
public final class Node: Identifiable {
    public let id: Int
    /// The JSX tag (`"VStack"`, `"Button"`…), or `"#text"` for raw strings.
    public let type: String
    public internal(set) var props: [String: Any]
    /// Props computed by an animated style on the main thread (see
    /// `WorkletRuntime`). They override `props` with the same key.
    public private(set) var animatedProps: [String: Any] = [:]
    public internal(set) var text: String
    public internal(set) var children: [Node] = []
    /// Bumped when shared values a `<Canvas draw>` worklet read change.
    var canvasVersion = 0
    @ObservationIgnored weak var parent: Node?

    // Imperative requests from refs (`ref.current.focus()` / `.scrollTo()`).
    var focusRequest = FocusRequest()
    var selectionRequest = SelectionRequest()
    var scrollRequest: ScrollRequest?
    /// The last `scrollRequest` a scroll view carried out: a view that appears
    /// again (back from a pushed screen) doesn't replay it.
    @ObservationIgnored var handledScroll = 0
    /// Last laid-out frame in window coordinates, for `ref.current.measure()`.
    @ObservationIgnored private(set) var frame: CGRect = .zero
    /// `measure()` calls made before the first layout, answered by it.
    @ObservationIgnored private var waitingForLayout: [(CGRect) -> Void] = []

    func setFrame(_ frame: CGRect) {
        self.frame = frame
        let waiting = waitingForLayout
        waitingForLayout = []
        waiting.forEach { $0(frame) }
    }

    /// The frame now, or after the first layout if there hasn't been one
    /// (giving up, with a zero frame, after a second).
    func measure(_ done: @escaping (CGRect) -> Void) {
        guard frame == .zero else { return done(frame) }
        waitingForLayout.append(done)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [weak self] in
            MainActor.assumeIsolated {
                guard let self, !self.waitingForLayout.isEmpty else { return }
                self.setFrame(self.frame)
            }
        }
    }
    /// `<Image src>`: the URL whose `onLoad`/`onError` was last reported.
    @ObservationIgnored var reportedImageURL: URL?
    /// Controlled inputs: sequence number of the last value sent to JS…
    @ObservationIgnored var sentSeq = 0
    /// …and of the last event JS had processed when it rendered these props.
    var ackSeq: Int { (props["__seq"] as? NSNumber)?.intValue ?? 0 }

    /// Whether `NodeView` wraps this node in modifiers. Once true it stays true:
    /// adding or removing the wrapper changes the view's identity, and SwiftUI
    /// resets the state of a view whose identity changes (a text field loses
    /// focus, a scroll view its position). Each modifier is a no-op while its
    /// prop is unset instead.
    private(set) var decorated = false

    /// Modifiers that aren't free when unset are attached the first time their
    /// prop is used, and then stay (same identity reasoning as `decorated`).
    /// `foregroundStyle` has no no-op value (even `.foreground` flattens the
    /// secondary styles a List gives its headers); an idle tap gesture or an
    /// explicit `.id` on every decorated view doubled scroll hitches in a 100k
    /// VirtualList on an iPhone 15 Pro Max.
    private(set) var features: Set<Feature> = []

    enum Feature {
        case foreground, tap, ref, transform
        case doubleTap, longPress, drag, magnify, rotate
        case accessibility, accessibilityElement
        case refresh, swipeActions, contextMenu
        case overlay, backgroundView, contentShape, layout, relativeFrame, listRow
        case tint, aspectRatio, safeAreaInset, keyPress, keyframes, appear, press
    }

    /// Called after props or children change.
    func updateDecorated() {
        for (key, feature) in Self.featureKeys where !features.contains(feature) && has(key) {
            features.insert(feature)
        }
        for child in children {
            switch child.type {
            case "SwipeActions": features.insert(.swipeActions)
            case "ContextMenu": features.insert(.contextMenu)
            case "Overlay": features.insert(.overlay)
            case "Background": features.insert(.backgroundView)
            case "SafeAreaInset": features.insert(.safeAreaInset)
            default: break
            }
        }
        guard !decorated else { return }
        // `tint` decorates containers (it tints everything inside); controls
        // apply it themselves (see NodeView.tinted).
        if Self.alwaysDecorated.contains(type) || props.keys.contains(where: Self.modifierKeys.contains)
            || (has("tint") && !NodeView.selfTinted.contains(type))
            || animatedProps.keys.contains(where: Self.modifierKeys.contains) || has("animatedStyle")
            || has("__ref") || children.contains(where: \.isAttachment) {
            decorated = true
        }
    }

    static let interactionFeatures: Set<Feature> = [
        .transform, .doubleTap, .longPress, .drag, .magnify, .rotate, .accessibility, .accessibilityElement, .keyPress, .keyframes, .appear, .press,
    ]

    static let featureKeys: [(String, Feature)] = [
        ("foregroundStyle", .foreground), ("onTapGesture", .tap), ("__ref", .ref),
        ("offset", .transform), ("scale", .transform), ("rotation", .transform),
        ("scaleX", .transform), ("scaleY", .transform), ("rotation3D", .transform), ("keyframes", .keyframes), ("initial", .appear),
        ("onDoubleTap", .doubleTap), ("onLongPress", .longPress),
        ("onPressIn", .press), ("onPressOut", .press), ("pressedScale", .press), ("pressedOpacity", .press),
        ("onDrag", .drag), ("onDragEnd", .drag), ("onDragStart", .drag), ("onMagnify", .magnify), ("onMagnifyEnd", .magnify),
        ("onRotate", .rotate), ("onRotateEnd", .rotate),
        ("accessibilityLabel", .accessibility), ("accessibilityHint", .accessibility),
        ("accessibilityValue", .accessibility), ("accessibilityHidden", .accessibility),
        ("accessibilityIdentifier", .accessibility), ("accessibilityTraits", .accessibility),
        ("accessibilitySortPriority", .accessibility), ("accessibilityActions", .accessibility),
        ("onAccessibilityIncrement", .accessibility), ("onAccessibilityDecrement", .accessibility),
        ("accessibilityElement", .accessibility), ("accessibilityElement", .accessibilityElement),
        ("onRefresh", .refresh),
        ("contentShape", .contentShape), ("onLayout", .layout), ("onSafeAreaChange", .layout),
        ("relativeWidth", .relativeFrame), ("relativeHeight", .relativeFrame),
        ("listRowBackground", .listRow), ("listRowInsets", .listRow), ("listRowSeparator", .listRow), ("badge", .listRow),
        ("tint", .tint), ("aspectRatio", .aspectRatio), ("onKeyPress", .keyPress),
    ]

    static let modifierKeys: Set<String> = Set([
        "padding", "frame", "background", "foregroundStyle", "font", "fontWeight", "fontDesign",
        "cornerRadius", "border", "shadow", "opacity", "disabled", "transition", "onAppear",
        "onTapGesture", "hidden", "onDisappear", "colorScheme", "zIndex", "layoutPriority", "gridColumns",
        "fixedSize", "allowsHitTesting", "preferredColorScheme", "tag", "redacted", "ignoresSafeArea", "interactiveDismissDisabled", "position",
        "controlSize", "labelStyle", "statusBarHidden", "persistentSystemOverlays", "transitionSource",
        "draggable", "onDrop", "onDropTargetChange", "blur", "clipped",
    ]).union(featureKeys.map(\.0)).subtracting(["__ref"])

    /// Views with state of their own get the wrapper from the start, so even
    /// the first modifier prop doesn't reset them.
    static let alwaysDecorated: Set<String> = [
        "TextField", "TextEditor", "Toggle", "Slider", "Stepper", "Picker", "DatePicker", "ColorPicker",
        "ScrollView", "VirtualList", "List", "Form",
    ]

    /// Sheets and alerts aren't laid out; their parent presents them.
    var isPresentation: Bool { Self.presentationTypes.contains(type) }
    /// Children that aren't laid out but modify their parent: presentations,
    /// `<SwipeActions>`, `<ContextMenu>`.
    var isAttachment: Bool { isPresentation || Self.attachmentTypes.contains(type) }
    static let attachmentTypes: Set<String> = ["SwipeActions", "ContextMenu", "Overlay", "Background", "SectionHeader", "SectionFooter", "SafeAreaInset", "LabeledContentLabel"]
    static let presentationTypes: Set<String> = ["Sheet", "Alert", "ConfirmationDialog"]

    init(id: Int, type: String, props: [String: Any] = [:], text: String = "") {
        self.id = id
        self.type = type
        self.props = props
        self.text = text
    }

    /// Concatenated text of this node and its descendants, so
    /// `<Text>Count: {n}</Text>` (two text children) renders as one string.
    var textContent: String {
        type == "#text" ? text : children.map(\.textContent).joined()
    }

    func setAnimatedProps(_ new: [String: Any]) {
        guard !(new as NSDictionary).isEqual(to: animatedProps) else { return }
        animatedProps = new
        updateDecorated()
    }

    // MARK: Typed prop access (animated props first)

    func prop(_ key: String) -> Any? {
        animatedProps.isEmpty ? props[key] : animatedProps[key] ?? props[key]
    }
    func string(_ key: String) -> String? { prop(key) as? String }
    func bool(_ key: String) -> Bool { (prop(key) as? Bool) ?? false }
    func double(_ key: String) -> Double? { (prop(key) as? NSNumber)?.doubleValue }
    func cgFloat(_ key: String) -> CGFloat? { double(key).map { CGFloat($0) } }
    func dict(_ key: String) -> [String: Any]? { prop(key) as? [String: Any] }
    func has(_ key: String) -> Bool { prop(key) != nil }
}

/// `ref.current.setSelection(start, end)`: UTF-16 offsets.
struct SelectionRequest: Equatable {
    var seq = 0
    var start = 0
    var end = 0
}

struct FocusRequest: Equatable {
    var seq = 0
    var focused = false
}

struct ScrollRequest: Equatable {
    var seq: Int
    /// A node id, a VirtualList row index, or a `ScrollEdge`.
    var target: AnyHashable
    var anchor: UnitPoint?
    var animated: Bool
}

enum ScrollEdge: Hashable { case top, end }

/// `scrollTo({ x, y })`: a content offset in points.
struct ScrollOffset: Hashable {
    var x: CGFloat?
    var y: CGFloat?
}

/// The mirror of React's host tree on the Swift side. Applies the op stream
/// produced by `js/renderer.ts`.
@MainActor
public final class NodeTree {
    public let root = Node(id: 0, type: "#root")
    private var nodes: [Int: Node] = [:]
    /// `animation` values set by update ops later in the batch being applied.
    private var upcomingAnimations: [Int: Any] = [:]
    /// Nodes whose `animationKey` changes in the batch being applied.
    private var keyChanges: Set<Int> = []
    /// Runs `animatedStyle` worklets for nodes that have one.
    var worklets: WorkletRuntime?

    init() { reset() }

    func reset() {
        root.children = []
        nodes = [0: root]
    }

    public func node(_ id: Int) -> Node? { nodes[id] }

    func apply(_ ops: [[String: Any]]) {
        SwiftJSXDiagnostics.commits += 1
        SwiftJSXDiagnostics.ops += ops.count
        defer { SwiftJSXDiagnostics.countRenderedRows(in: root) }
        // React applies a commit's child insertions and removals before the
        // parent's own prop update, so `<ZStack animation={show ? A : B}>{show
        // && <X/>}` would insert X under the old B. Look ahead: structural ops
        // use the `animation` this commit is about to set.
        upcomingAnimations = [:]
        keyChanges = []
        for op in ops where op["op"] as? String == "update" {
            if let id = (op["id"] as? NSNumber)?.intValue, (op["props"] as? [String: Any])?["animationKey"] != nil {
                keyChanges.insert(id)
            }
            if let id = (op["id"] as? NSNumber)?.intValue, let changes = op["props"] as? [String: Any],
               let animation = changes["animation"], upcomingAnimations[id] == nil {
                upcomingAnimations[id] = animation
            }
        }
        defer { upcomingAnimations = [:] }
        for op in ops {
            let kind = op["op"] as? String
            let id = (op["id"] as? NSNumber)?.intValue ?? -1
            switch kind {
            case "create":
                let node = Node(id: id, type: op["type"] as? String ?? "?", props: clean(op["props"]))
                nodes[id] = node
                // Before the first render, so the style's props are there from the start.
                if node.has("animatedStyle") { worklets?.setStyle(node, node.props["animatedStyle"]) }
                node.updateDecorated()
            case "text":
                nodes[id] = Node(id: id, type: "#text", text: op["text"] as? String ?? "")
            case "append", "insert", "remove":
                guard let parent = nodes[int(op["parent"])], let child = nodes[int(op["child"])] else { continue }
                animating(parent) {
                    // React may "move" a node by appending/inserting it again.
                    parent.children.removeAll { $0 === child }
                    switch kind {
                    case "remove":
                        child.parent = nil
                        forget(child)
                    case "insert":
                        let idx = parent.children.firstIndex { $0.id == int(op["before"]) } ?? parent.children.endIndex
                        parent.children.insert(child, at: idx)
                        child.parent = parent
                    default:
                        parent.children.append(child)
                        child.parent = parent
                    }
                }
                if child.isAttachment { parent.updateDecorated() }
            case "update":
                guard let node = nodes[id] else { continue }
                let changes = op["props"] as? [String: Any] ?? [:]
                // An update that changes `animation` too is animated (or not)
                // by the new value: `animation={dragging ? undefined : "spring"}`
                // follows the finger, then springs back on release.
                let animation: Any?? = changes.keys.contains("animation") ? .some(changes["animation"].flatMap { $0 is NSNull ? nil : $0 }) : nil
                // Chart marks' styles change without animation: Swift Charts
                // drops a color change made in an animated transaction.
                let unanimated = node.type.hasSuffix("Mark") ? changes.filter { Self.markStyleKeys.contains($0.key) } : [:]
                if !unanimated.isEmpty {
                    var transaction = Transaction()
                    transaction.disablesAnimations = true
                    withTransaction(transaction) {
                        for (key, value) in unanimated { node.props[key] = value is NSNull ? nil : value }
                    }
                }
                animating(node, animation) {
                    for (key, value) in changes where unanimated[key] == nil {
                        node.props[key] = value is NSNull ? nil : value
                    }
                }
                upcomingAnimations[id] = nil
                if changes.keys.contains("animatedStyle") { worklets?.setStyle(node, node.props["animatedStyle"]) }
                node.updateDecorated()
            case "setText":
                guard let node = nodes[id] else { continue }
                animating(node.parent ?? node) { node.text = op["text"] as? String ?? "" }
            default:
                continue
            }
        }
    }

    private func forget(_ node: Node) {
        nodes[node.id] = nil
        if node.has("animatedStyle") || node.props.values.contains(where: WorkletRuntime.isWorklet) {
            worklets?.removeStyle(node)
        }
        node.children.forEach(forget)
    }

    /// Mutations to a node that has an `animation` prop (or whose parent does)
    /// run inside `withAnimation`, so `transition` and implicit animations work.
    private func animating(_ node: Node, _ override: Any?? = nil, _ body: () -> Void) {
        // `animationKey`: the owner's animation only runs in commits that change the key.
        if let owner = animationOwner(node, override), owner.has("animationKey"), !keyChanges.contains(owner.id) {
            return body()
        }
        let spec = override ?? animation(of: node) ?? inheritedAnimation(node.parent)
        if let animation = parseAnimation(spec) {
            SwiftJSXDiagnostics.animatedOps += 1
            withAnimation(animation, body)
        } else {
            body()
        }
    }

    /// The node whose `animation` applies to a change on `node`.
    private func animationOwner(_ node: Node, _ override: Any??) -> Node? {
        if override != nil || animation(of: node) != nil { return node }
        var current = node.parent
        while let n = current {
            if animation(of: n) != nil { return n }
            current = n.parent
        }
        return nil
    }

    /// The nearest ancestor's `animation`: like SwiftUI's `.animation`, it
    /// covers the whole subtree.
    private func inheritedAnimation(_ node: Node?) -> Any? {
        var current = node
        while let n = current {
            if let animation = animation(of: n) { return animation }
            current = n.parent
        }
        return nil
    }

    static let markStyleKeys: Set<String> = ["foregroundStyle", "opacity", "lineWidth", "dash", "annotation"]

    /// A node's `animation`, or the one this commit is about to give it
    /// (nil when it's being removed).
    private func animation(of node: Node) -> Any? {
        if let upcoming = upcomingAnimations[node.id] { return upcoming is NSNull ? nil : upcoming }
        return node.props["animation"]
    }

    private func int(_ v: Any?) -> Int { (v as? NSNumber)?.intValue ?? -1 }

    private func clean(_ v: Any?) -> [String: Any] {
        (v as? [String: Any] ?? [:]).filter { !($0.value is NSNull) }
    }
}
