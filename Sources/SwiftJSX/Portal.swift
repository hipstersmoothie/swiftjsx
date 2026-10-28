import SwiftUI
#if os(iOS)
import UIKit
#endif

/// `<Portal>`: its children draw in a window above everything in the app,
/// presented sheets and the navigation and tab bars included (toasts, a
/// thumbnail flying to the cart), placed in the screen by `alignment`. Touches
/// go through to the app, unless `interactive`: then the children's own
/// frames take them. On macOS they draw in place.
struct PortalHost: View {
    let node: Node

    var body: some View {
        #if os(iOS)
        PortalAnchor(node: node)
            .frame(width: 0, height: 0)
            .allowsHitTesting(false)
        #else
        ZStack { Children(node: node) }
        #endif
    }
}

#if os(iOS)
/// Finds the window scene and keeps `node` registered with its portal window
/// while mounted.
private struct PortalAnchor: UIViewRepresentable {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime

    func makeUIView(context: Context) -> AnchorView {
        let view = AnchorView()
        view.onWindow = { [node, runtime] scene in
            guard let scene, let runtime else { return }
            PortalWindows.shared.add(node, runtime: runtime, scene: scene)
        }
        view.remove = { PortalWindows.shared.prune() }
        return view
    }

    func updateUIView(_ view: AnchorView, context: Context) {}

    static func dismantleUIView(_ view: AnchorView, coordinator: ()) {
        view.remove?()
    }

    final class AnchorView: UIView {
        var onWindow: ((UIWindowScene?) -> Void)?
        var remove: (() -> Void)?
        override func didMoveToWindow() {
            super.didMoveToWindow()
            if let scene = window?.windowScene {
                onWindow?(scene)
            }
        }
    }
}

/// One passthrough window per scene, showing every mounted `<Portal>`.
@MainActor @Observable
final class PortalWindows {
    static let shared = PortalWindows()

    private(set) var nodes: [Node] = []
    /// Frames (window coordinates) of interactive portals' children.
    @ObservationIgnored var touchFrames: [Int: CGRect] = [:]
    @ObservationIgnored private var windows: [ObjectIdentifier: PassthroughWindow] = [:]

    func add(_ node: Node, runtime: JSXRuntime, scene: UIWindowScene) {
        if !nodes.contains(where: { $0 === node }) { nodes.append(node) }
        let key = ObjectIdentifier(scene)
        if windows[key] == nil {
            let window = PassthroughWindow(windowScene: scene)
            window.portals = self
            window.windowLevel = .alert + 1
            window.backgroundColor = .clear
            let host = UIHostingController(rootView: PortalRoot(windows: self).environment(\.jsxRuntime, runtime))
            host.view.backgroundColor = .clear
            window.rootViewController = host
            window.isHidden = false
            windows[key] = window
        }
        // Nodes leave when React removes them (their parent's children change).
        prune()
    }

    /// Drops portals React has unmounted; hides windows with nothing to show.
    func prune() {
        nodes.removeAll { $0.parent == nil }
        touchFrames = touchFrames.filter { id, _ in nodes.contains { $0.children.contains { $0.id == id } } }
        for window in windows.values { window.isHidden = nodes.isEmpty }
    }
}

private struct PortalRoot: View {
    let windows: PortalWindows

    var body: some View {
        ZStack {
            ForEach(windows.nodes) { node in
                let placement = alignment(node.string("alignment")) ?? .center
                ZStack(alignment: placement) {
                    ForEach(node.children.filter { !$0.isAttachment }) { child in
                        NodeView(node: child)
                            .onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { frame in
                                if node.bool("interactive") { windows.touchFrames[child.id] = frame } else { windows.touchFrames[child.id] = nil }
                            }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: placement)
                .padding()
                .onDisappear { windows.prune() }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .ignoresSafeArea(.container, edges: [])
    }
}

/// Takes touches only inside interactive portals' children; the rest go to
/// the app. (SwiftUI content has no UIViews of its own to hit-test.)
final class PassthroughWindow: UIWindow {
    weak var portals: PortalWindows?

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let inside = MainActor.assumeIsolated { portals?.touchFrames.values.contains { $0.contains(point) } ?? false }
        return inside ? super.hitTest(point, with: event) : nil
    }
}
#endif
