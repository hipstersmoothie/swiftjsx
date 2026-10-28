import SwiftUI

/// `<NativeView>`: hosts a view made in JS with the native backend. JS puts
/// it in the main thread's dictionary under `viewKey` (see
/// js/native-view.tsx); it's taken from there into a container here.
@MainActor
struct NativeViewHost {
    let node: Node

    static func view(for key: String?) -> PlatformView? {
        guard let key else { return nil }
        return Thread.main.threadDictionary[key] as? PlatformView
    }

    func update(_ container: Container) {
        container.fits = node.string("sizing") == "fit"
        let view = Self.view(for: node.string("viewKey"))
        guard view !== container.hosted else { return }
        container.hosted?.removeFromSuperview()
        container.hosted = view
        guard let view else { return }
        view.frame = container.bounds
        #if os(iOS)
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        #else
        view.autoresizingMask = [.width, .height]
        #endif
        container.addSubview(view)
    }

    func size(_ proposal: ProposedViewSize, _ container: Container) -> CGSize? {
        guard container.fits, let view = container.hosted else { return nil }
        #if os(iOS)
        let fitting = view.sizeThatFits(CGSize(width: proposal.width ?? .greatestFiniteMagnitude, height: proposal.height ?? .greatestFiniteMagnitude))
        #else
        let fitting = view.fittingSize
        #endif
        return fitting
    }

    final class Container: PlatformView {
        var hosted: PlatformView?
        var fits = false
    }
}

#if os(iOS)
typealias PlatformView = UIView

extension NativeViewHost: UIViewRepresentable {
    func makeUIView(context: Context) -> Container { Container() }
    func updateUIView(_ container: Container, context: Context) { update(container) }
    func sizeThatFits(_ proposal: ProposedViewSize, uiView: Container, context: Context) -> CGSize? { size(proposal, uiView) }
}
#else
typealias PlatformView = NSView

extension NativeViewHost: NSViewRepresentable {
    func makeNSView(context: Context) -> Container { Container() }
    func updateNSView(_ container: Container, context: Context) { update(container) }
    func sizeThatFits(_ proposal: ProposedViewSize, nsView: Container, context: Context) -> CGSize? { size(proposal, nsView) }
}
#endif
