import SwiftUI

/// `<NavigationStack>`: child 0 is the root, children 1… are pushed screens.
/// The path is derived from React's children, so pushing is just rendering
/// another child; popping (back button, swipe) is reported via `onPathChange`.
struct NavigationStackHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    /// Path after a user-initiated pop, until React's commit catches up.
    @State private var poppedPath: [Int]?
    /// Keeps popped pages alive through the pop animation, after React has
    /// already removed them.
    @State private var pages = PageCache()
    /// Zoom transitions: `transitionSource` views and `<Screen zoomFrom>`.
    @Namespace private var zoom

    var body: some View {
        let children = node.children.filter { !$0.isAttachment }
        let pushed = children.dropFirst().map(\.id)
        let _ = pages.remember(children)

        NavigationStack(path: Binding(
            get: { poppedPath ?? pushed },
            set: { newPath in
                guard newPath.count < pushed.count else { return }
                poppedPath = newPath
                runtime?.dispatch(node.id, "onPathChange", newPath.count)
            }
        )) {
            Group {
                if let root = children.first { NodeView(node: root) }
            }
            .navigationDestination(for: Int.self) { id in
                if let page = pages.nodes[id] { NodeView(node: page) }
            }
        }
        .onChange(of: pushed) { poppedPath = nil }
        .environment(\.zoomNamespace, zoom)
    }
}

@MainActor
final class PageCache {
    var nodes: [Int: Node] = [:]
    func remember(_ children: [Node]) {
        for child in children { nodes[child.id] = child }
        if nodes.count > children.count * 2 + 8 {
            let live = Set(children.map(\.id))
            nodes = nodes.filter { live.contains($0.key) }
        }
    }
}

/// `<Screen title=…>`: navigation title + toolbar for the screen it's in.
struct ScreenHost: View {
    let node: Node

    var body: some View {
        let items = node.children.filter { $0.type == "ToolbarItem" }
        VStack(spacing: 0) {
            ForEach(node.children.filter { $0.type != "ToolbarItem" && !$0.isAttachment }) { NodeView(node: $0) }
        }
        .modifier(SearchableModifier(node: node))
        .modifier(ToolbarStyle(node: node))
        .navigationTitle(node.string("title") ?? "")
        .modifier(Subtitle(text: node.string("subtitle")))
        .modifier(ZoomDestination(id: node.string("zoomFrom")))
        #if os(iOS)
        .navigationBarTitleDisplayMode(titleDisplayMode(node.string("titleDisplayMode")))
        #endif
        .toolbar { ScreenToolbar(items: items) }
    }
}

/// The screen's `<ToolbarItem>`s, each at its placement.
private struct ScreenToolbar: ToolbarContent {
    let items: [Node]

    #if os(iOS)
    /// Above the keyboard and in the bottom bar, an item's children are the
    /// group's own items, so a `<Spacer />` among them spans the bar ("Done"
    /// on the trailing edge).
    private static let barPlacements = ["keyboard", "bottomBar"]

    // Up to twelve items, each its own ToolbarItem (its own glass button).
    // Not a ForEach: Xcode 26's iOS SDK has no ForEach of toolbar content
    // before iOS 26 (Xcode 27's back-deploys it).
    var body: some ToolbarContent {
        let regular = items.filter { !Self.barPlacements.contains($0.string("placement") ?? "") }
        item(regular, 0)
        item(regular, 1)
        item(regular, 2)
        item(regular, 3)
        item(regular, 4)
        item(regular, 5)
        item(regular, 6)
        item(regular, 7)
        item(regular, 8)
        item(regular, 9)
        item(regular, 10)
        item(regular, 11)
        bar("keyboard")
        bar("bottomBar")
    }

    @ToolbarContentBuilder
    private func item(_ list: [Node], _ index: Int) -> some ToolbarContent {
        if index < list.count {
            ToolbarItem(placement: toolbarPlacement(list[index].string("placement"))) {
                HStack { Children(node: list[index]) }
            }
        }
    }

    /// None: no group (an empty one still shows a bar over the keyboard).
    @ToolbarContentBuilder
    private func bar(_ placement: String) -> some ToolbarContent {
        let matching = items.filter { $0.string("placement") == placement }
        if !matching.isEmpty {
            ToolbarItemGroup(placement: toolbarPlacement(placement)) {
                ForEach(matching) { item in Children(node: item) }
            }
        }
    }
    #else
    // Xcode 26's macOS SDK has no ForEach of toolbar content before macOS 26:
    // one group per placement, each a plain ForEach of views.
    var body: some ToolbarContent {
        group("primaryAction")
        group("cancellationAction")
        group("confirmationAction")
        group("principal")
        group("navigation")
        group(nil)
    }

    private func group(_ placement: String?) -> some ToolbarContent {
        let known = ["primaryAction", "cancellationAction", "confirmationAction", "principal", "navigation"]
        let matching = items.filter { item in
            let name = item.string("placement")
            return placement.map { name == $0 } ?? !known.contains(name ?? "")
        }
        return ToolbarItemGroup(placement: toolbarPlacement(placement)) {
            ForEach(matching) { item in HStack { Children(node: item) } }
        }
    }
    #endif
}

/// `toolbarBackground` (a fill, or "hidden") and `toolbarColorScheme` on a
/// `<Screen>`: the navigation bar's background, and light or dark items.
struct ToolbarStyle: ViewModifier {
    let node: Node

    func body(content: Content) -> some View {
        let background = node.prop("toolbarBackground")
        #if os(iOS)
        let bar = ToolbarPlacement.navigationBar
        #else
        let bar = ToolbarPlacement.windowToolbar
        #endif
        let styled = content
            .toolbarColorScheme(colorScheme(node.string("toolbarColorScheme")), for: bar)
            // `navigationBar="hidden"` / `tabBar="hidden"`: always applied (a
            // value, not a branch), so toggling them keeps the screen's state.
            .toolbarVisibility(node.string("navigationBar") == "hidden" ? .hidden : .automatic, for: bar)
            #if os(iOS)
            .toolbarVisibility(node.string("tabBar") == "hidden" ? .hidden : .automatic, for: .tabBar)
            #endif
            .modifier(ScrollEdgeEffect(style: node.string("scrollEdgeEffect")))
            .toolbarBackgroundVisibility(background == nil ? .automatic : (background as? String == "hidden" ? .hidden : .visible), for: bar)
        // One branch whenever the prop is set (a fill or "hidden"), so switching
        // between them mid-scroll doesn't make a new view (and reset the scroll).
        if background != nil {
            styled.toolbarBackground(fill(background) ?? AnyShapeStyle(Color.clear), for: bar)
        } else {
            styled
        }
    }
}

/// `scrollEdgeEffect` (iOS 26): how scroll views fade under the bars:
/// "soft" (default), "hard" (a crisp edge), or "hidden" (none: for your own
/// bar drawn over the content).
private struct ScrollEdgeEffect: ViewModifier {
    let style: String?
    func body(content: Content) -> some View {
        if #available(iOS 26, macOS 26, *) {
            content
                .scrollEdgeEffectStyle(style == "hard" ? .hard : .soft, for: .all)
                .scrollEdgeEffectHidden(style == "hidden", for: .all)
        } else {
            content
        }
    }
}

/// `searchText` / `onSearchTextChange` / `searchPrompt` on a `<Screen>`: the
/// navigation bar's search field. Shows what the user typed until React's
/// `searchText` catches up.
/// A screen's search field: `searchText` / `onSearchTextChange`, whether it's
/// active (`searchActive` / `onSearchActiveChange`: dismiss it from code, or
/// know when the user cancels), `onSearchSubmit`, scopes
/// (`searchScopes` + `searchScope` / `onSearchScopeChange`) and suggestions
/// (`searchSuggestions`: `{ title, completion? }`, tapping fills the field).
struct SearchableModifier: ViewModifier {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @State private var typed: String?
    @State private var active = false
    @State private var scope = ""

    func body(content: Content) -> some View {
        if node.has("onSearchTextChange") || node.has("searchText") {
            content
                .searchable(text: Binding(
                    get: { typed ?? node.string("searchText") ?? "" },
                    set: { text in
                        typed = text
                        runtime?.dispatch(node.id, "onSearchTextChange", text)
                    }
                ), isPresented: $active, placement: searchPlacement(node.string("searchPlacement")),
                   prompt: node.string("searchPrompt").map { Text($0) })
                .onChange(of: node.string("searchText")) { _, text in if text == typed { typed = nil } }
                .onChange(of: active) { _, isActive in
                    if node.has("onSearchActiveChange") { runtime?.dispatch(node.id, "onSearchActiveChange", isActive) }
                }
                .onChange(of: node.prop("searchActive") as? Bool, initial: true) { _, wanted in
                    if let wanted, wanted != active { active = wanted }
                }
                .onSubmit(of: .search) {
                    if node.has("onSearchSubmit") { runtime?.dispatch(node.id, "onSearchSubmit", typed ?? node.string("searchText") ?? "") }
                }
                .modifier(Scopes(node: node, scope: $scope))
                .modifier(Suggestions(node: node))
        } else {
            content
        }
    }

    private struct Scopes: ViewModifier {
        let node: Node
        @Binding var scope: String
        @Environment(\.jsxRuntime) private var runtime

        func body(content: Content) -> some View {
            let scopes = (node.props["searchScopes"] as? [[String: Any]]) ?? []
            if scopes.isEmpty {
                content
            } else {
                content
                    .searchScopes(Binding(
                        get: { node.string("searchScope") ?? scope },
                        set: { value in
                            scope = value
                            runtime?.dispatch(node.id, "onSearchScopeChange", value)
                        }
                    ), activation: .onSearchPresentation) {
                        ForEach(scopes.indices, id: \.self) { i in
                            Text(scopes[i]["label"] as? String ?? "").tag(scopes[i]["value"] as? String ?? "")
                        }
                    }
            }
        }
    }

    private struct Suggestions: ViewModifier {
        let node: Node
        func body(content: Content) -> some View {
            let suggestions = (node.props["searchSuggestions"] as? [[String: Any]]) ?? []
            if node.has("searchSuggestions") {
                content.searchSuggestions {
                    ForEach(suggestions.indices, id: \.self) { i in
                        let title = suggestions[i]["title"] as? String ?? ""
                        Label(title, systemImage: suggestions[i]["systemImage"] as? String ?? "magnifyingglass")
                            .searchCompletion(suggestions[i]["completion"] as? String ?? title)
                    }
                }
            } else {
                content
            }
        }
    }
}

private func searchPlacement(_ name: String?) -> SearchFieldPlacement {
    switch name {
    #if os(iOS)
    case "navigationBar": .navigationBarDrawer(displayMode: .always)
    #endif
    case "toolbar": .toolbar
    default: .automatic
    }
}

/// Attaches `<Sheet>` / `<Alert>` / `<ConfirmationDialog>` children of `node`.
struct Presenters: View {
    let node: Node
    var body: some View {
        let items = node.children.filter(\.isPresentation)
        if !items.isEmpty {
            ZStack {
                ForEach(items) { PresentationHost(node: $0) }
            }
        }
    }
}

struct PresentationHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    /// Set when the user dismisses, until React flips `isPresented` too —
    /// otherwise the stale `true` would re-present it.
    @State private var dismissed = false

    private var isPresented: Binding<Bool> {
        Binding(
            get: { node.bool("isPresented") && !dismissed },
            set: { presented in
                guard !presented, !dismissed else { return }
                dismissed = true
                runtime?.dispatch(node.id, "onDismiss")
            }
        )
    }

    var body: some View {
        let title = node.string("title") ?? ""
        let message = node.string("message")
        content(title: title, message: message)
            .onChange(of: node.bool("isPresented")) { dismissed = false }
    }

    @ViewBuilder private func content(title: String, message: String?) -> some View {
        switch node.type {
        case "Sheet":
            #if os(iOS)
            if node.bool("fullScreen") {
                Color.clear.fullScreenCover(isPresented: isPresented, onDismiss: reportGone) { sheetContent }
            } else {
                Color.clear.sheet(isPresented: isPresented, onDismiss: reportGone) { sheetContent }
            }
            #else
            Color.clear.sheet(isPresented: isPresented, onDismiss: reportGone) { sheetContent }
            #endif
        case "Alert":
            Color.clear.alert(title, isPresented: isPresented) {
                Children(node: node)
            } message: {
                if let message { Text(message) }
            }
        default:
            Color.clear.confirmationDialog(title, isPresented: isPresented, titleVisibility: .visible) {
                Children(node: node)
            } message: {
                if let message { Text(message) }
            }
        }
    }

    /// The sheet has gone (after its animation), however it was dismissed.
    private func reportGone() {
        if node.has("onDismissed") { runtime?.dispatch(node.id, "onDismissed") }
    }

    private var sheetContent: some View {
        VStack(spacing: 0) { Children(node: node) }
            .background { Presenters(node: node) }
            .presentationDetents(detents)
            // A sheet with unsaved changes can refuse the swipe down.
            .interactiveDismissDisabled(node.bool("interactiveDismissDisabled"))
            .presentationDragIndicator(node.string("dragIndicator") == "visible" ? .visible : node.string("dragIndicator") == "hidden" ? .hidden : .automatic)
            .presentationCornerRadius(node.cgFloat("cornerRadius"))
            .modifier(SheetBackground(fill: fill(node.prop("background"))))
            // `zoomFrom`: zooms out of the view with that `transitionSource`
            // (a thumbnail to its full-screen viewer), and back into it.
            .modifier(ZoomDestination(id: node.string("zoomFrom")))
            #if os(iOS)
            .background {
                if node.has("onDismissAttempt") {
                    DismissAttemptProbe { [weak runtime, node] in runtime?.dispatch(node.id, "onDismissAttempt") }
                }
            }
            #endif
            .environment(\.jsxRuntime, runtime)
    }

    private struct SheetBackground: ViewModifier {
        let fill: AnyShapeStyle?
        func body(content: Content) -> some View {
            if let fill { content.presentationBackground(fill) } else { content }
        }
    }

    private var detents: Set<PresentationDetent> {
        let list = (node.props["detents"] as? [Any] ?? []).compactMap { value -> PresentationDetent? in
            switch value {
            case let s as String where s == "medium": .medium
            case let s as String where s == "large": .large
            case let n as NSNumber: .height(CGFloat(n.doubleValue))
            default: nil
            }
        }
        return list.isEmpty ? [.large] : Set(list)
    }
}

private func toolbarPlacement(_ name: String?) -> ToolbarItemPlacement {
    switch name {
    case "primaryAction": .primaryAction
    case "cancellationAction": .cancellationAction
    case "confirmationAction": .confirmationAction
    case "principal": .principal
    case "navigation": .navigation
    #if os(iOS)
    case "topBarLeading": .topBarLeading
    case "topBarTrailing": .topBarTrailing
    case "bottomBar": .bottomBar
    case "keyboard": .keyboard
    #endif
    default: .automatic
    }
}

#if os(iOS)
private func titleDisplayMode(_ name: String?) -> NavigationBarItem.TitleDisplayMode {
    switch name {
    case "inline": .inline
    case "large": .large
    default: .automatic
    }
}
#endif

/// `<Screen subtitle>` (iOS 26 / macOS 26: under the title).
private struct Subtitle: ViewModifier {
    let text: String?
    func body(content: Content) -> some View {
        // Always applied (empty when unset): adding it later would make a new
        // view and reset the screen's scroll position.
        if #available(iOS 26, macOS 26, *) {
            content.navigationSubtitle(text ?? "")
        } else {
            content
        }
    }
}

#if os(iOS)
/// `onDismissAttempt` on a `<Sheet>`: the user swiped down a sheet that
/// can't be dismissed (`interactiveDismissDisabled`), the moment to ask
/// "Discard changes?". UIKit tells the presentation controller's delegate,
/// which SwiftUI owns; a proxy in front of it adds this one callback and
/// forwards everything else.
private struct DismissAttemptProbe: UIViewControllerRepresentable {
    let onAttempt: () -> Void

    func makeUIViewController(context: Context) -> ProbeController {
        ProbeController(onAttempt: onAttempt)
    }

    func updateUIViewController(_ controller: ProbeController, context: Context) {
        controller.onAttempt = onAttempt
        controller.install()
    }

    final class ProbeController: UIViewController {
        var onAttempt: () -> Void
        private var proxy: DelegateProxy?

        init(onAttempt: @escaping () -> Void) {
            self.onAttempt = onAttempt
            super.init(nibName: nil, bundle: nil)
        }
        required init?(coder: NSCoder) { fatalError() }

        override func viewDidAppear(_ animated: Bool) {
            super.viewDidAppear(animated)
            install()
        }

        /// (Re)installs the proxy: SwiftUI may set its delegate again.
        func install() {
            // The presented controller: the one with a presentation controller.
            var current: UIViewController? = self
            while let controller = current, controller.presentingViewController == nil || controller.parent != nil {
                current = controller.parent
            }
            guard let presentation = (current ?? self).presentationController else { return }
            if let existing = presentation.delegate as? DelegateProxy, existing === proxy { return }
            let proxy = DelegateProxy(original: presentation.delegate) { [weak self] in self?.onAttempt() }
            self.proxy = proxy
            presentation.delegate = proxy
        }
    }

    final class DelegateProxy: NSObject, UIAdaptivePresentationControllerDelegate {
        weak var original: UIAdaptivePresentationControllerDelegate?
        let onAttempt: () -> Void

        init(original: UIAdaptivePresentationControllerDelegate?, onAttempt: @escaping () -> Void) {
            self.original = original
            self.onAttempt = onAttempt
        }

        func presentationControllerDidAttemptToDismiss(_ presentationController: UIPresentationController) {
            onAttempt()
            original?.presentationControllerDidAttemptToDismiss?(presentationController)
        }

        // Everything else goes to SwiftUI's delegate.
        override func responds(to selector: Selector!) -> Bool {
            super.responds(to: selector) || (original?.responds(to: selector) ?? false)
        }

        override func forwardingTarget(for selector: Selector!) -> Any? {
            original?.responds(to: selector) == true ? original : nil
        }
    }
}
#endif

/// `<Screen zoomFrom="id">`: the pushed screen zooms out of the view marked
/// `transitionSource="id"` (and back into it on pop). iOS.
private struct ZoomDestination: ViewModifier {
    let id: String?
    @Environment(\.zoomNamespace) private var namespace

    func body(content: Content) -> some View {
        #if os(iOS)
        if let id, let namespace {
            content.navigationTransition(.zoom(sourceID: id, in: namespace))
        } else {
            content
        }
        #else
        content
        #endif
    }
}

/// `transitionSource="id"`: where a `<Screen zoomFrom="id">` zooms from.
struct ZoomSource: ViewModifier {
    let id: String?
    @Environment(\.zoomNamespace) private var namespace

    func body(content: Content) -> some View {
        #if os(iOS)
        if let id, let namespace {
            content.matchedTransitionSource(id: id, in: namespace)
        } else {
            content
        }
        #else
        content
        #endif
    }
}
