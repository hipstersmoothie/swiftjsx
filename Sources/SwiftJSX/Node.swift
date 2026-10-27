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
    @ObservationIgnored weak var parent: Node?

    // Imperative requests from refs (`ref.current.focus()` / `.scrollTo()`).
    var focusRequest = FocusRequest()
    var scrollRequest: ScrollRequest?
    /// Last laid-out frame in window coordinates, for `ref.current.measure()`.
    @ObservationIgnored var frame: CGRect = .zero
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
        case refresh
    }

    /// Called after props or children change.
    func updateDecorated() {
        for (key, feature) in Self.featureKeys where !features.contains(feature) && has(key) {
            features.insert(feature)
        }
        guard !decorated else { return }
        if Self.alwaysDecorated.contains(type) || props.keys.contains(where: Self.modifierKeys.contains)
            || animatedProps.keys.contains(where: Self.modifierKeys.contains) || has("animatedStyle")
            || has("__ref") || children.contains(where: \.isPresentation) {
            decorated = true
        }
    }

    static let interactionFeatures: Set<Feature> = [
        .transform, .doubleTap, .longPress, .drag, .magnify, .rotate, .accessibility, .accessibilityElement,
    ]

    static let featureKeys: [(String, Feature)] = [
        ("foregroundStyle", .foreground), ("onTapGesture", .tap), ("__ref", .ref),
        ("offset", .transform), ("scale", .transform), ("rotation", .transform),
        ("onDoubleTap", .doubleTap), ("onLongPress", .longPress),
        ("onDrag", .drag), ("onDragEnd", .drag), ("onMagnify", .magnify), ("onMagnifyEnd", .magnify),
        ("onRotate", .rotate), ("onRotateEnd", .rotate),
        ("accessibilityLabel", .accessibility), ("accessibilityHint", .accessibility),
        ("accessibilityValue", .accessibility), ("accessibilityHidden", .accessibility),
        ("accessibilityIdentifier", .accessibility), ("accessibilityTraits", .accessibility),
        ("accessibilitySortPriority", .accessibility),
        ("accessibilityElement", .accessibility), ("accessibilityElement", .accessibilityElement),
        ("onRefresh", .refresh),
    ]

    static let modifierKeys: Set<String> = Set([
        "padding", "frame", "background", "foregroundStyle", "font", "fontWeight", "fontDesign",
        "cornerRadius", "border", "shadow", "opacity", "disabled", "transition", "onAppear",
        "onTapGesture", "hidden",
    ]).union(featureKeys.map(\.0)).subtracting(["__ref"])

    /// Views with state of their own get the wrapper from the start, so even
    /// the first modifier prop doesn't reset them.
    static let alwaysDecorated: Set<String> = [
        "TextField", "Toggle", "Slider", "Stepper", "Picker", "ScrollView", "VirtualList", "List", "Form",
    ]

    /// Sheets and alerts aren't laid out; their parent presents them.
    var isPresentation: Bool { Self.presentationTypes.contains(type) }
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

/// The mirror of React's host tree on the Swift side. Applies the op stream
/// produced by `js/renderer.ts`.
@MainActor
public final class NodeTree {
    public let root = Node(id: 0, type: "#root")
    private var nodes: [Int: Node] = [:]
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
                if child.isPresentation { parent.updateDecorated() }
            case "update":
                guard let node = nodes[id] else { continue }
                let changes = op["props"] as? [String: Any] ?? [:]
                // An update that changes `animation` too is animated (or not)
                // by the new value: `animation={dragging ? undefined : "spring"}`
                // follows the finger, then springs back on release.
                let animation: Any?? = changes.keys.contains("animation") ? .some(changes["animation"].flatMap { $0 is NSNull ? nil : $0 }) : nil
                animating(node, animation) {
                    for (key, value) in changes {
                        node.props[key] = value is NSNull ? nil : value
                    }
                }
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
        let spec = override ?? node.props["animation"] ?? node.parent?.props["animation"]
        if let animation = parseAnimation(spec) {
            withAnimation(animation, body)
        } else {
            body()
        }
    }

    private func int(_ v: Any?) -> Int { (v as? NSNumber)?.intValue ?? -1 }

    private func clean(_ v: Any?) -> [String: Any] {
        (v as? [String: Any] ?? [:]).filter { !($0.value is NSNull) }
    }
}
