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
        #if os(iOS)
        .navigationBarTitleDisplayMode(titleDisplayMode(node.string("titleDisplayMode")))
        #endif
        .toolbar {
            ForEach(items) { item in
                ToolbarItem(placement: toolbarPlacement(item.string("placement"))) {
                    HStack { Children(node: item) }
                }
            }
        }
    }
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
            .toolbarBackgroundVisibility(background == nil ? .automatic : (background as? String == "hidden" ? .hidden : .visible), for: bar)
        if let fill = fill(background) {
            styled.toolbarBackground(fill, for: bar)
        } else {
            styled
        }
    }
}

/// `searchText` / `onSearchTextChange` / `searchPrompt` on a `<Screen>`: the
/// navigation bar's search field. Shows what the user typed until React's
/// `searchText` catches up.
struct SearchableModifier: ViewModifier {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @State private var typed: String?

    func body(content: Content) -> some View {
        if node.has("onSearchTextChange") || node.has("searchText") {
            content
                .searchable(text: Binding(
                    get: { typed ?? node.string("searchText") ?? "" },
                    set: { text in
                        typed = text
                        runtime?.dispatch(node.id, "onSearchTextChange", text)
                    }
                ), placement: searchPlacement(node.string("searchPlacement")), prompt: node.string("searchPrompt").map { Text($0) })
                .onChange(of: node.string("searchText")) { _, text in if text == typed { typed = nil } }
        } else {
            content
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
                Color.clear.fullScreenCover(isPresented: isPresented) { sheetContent }
            } else {
                Color.clear.sheet(isPresented: isPresented) { sheetContent }
            }
            #else
            Color.clear.sheet(isPresented: isPresented) { sheetContent }
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

    private var sheetContent: some View {
        VStack(spacing: 0) { Children(node: node) }
            .background { Presenters(node: node) }
            .presentationDetents(detents)
            .environment(\.jsxRuntime, runtime)
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
