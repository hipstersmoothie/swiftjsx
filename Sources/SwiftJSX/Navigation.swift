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
        .modifier(Subtitle(text: node.string("subtitle")))
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
    var body: some ToolbarContent {
        ForEach(items) { item in
            ToolbarItem(placement: toolbarPlacement(item.string("placement"))) {
                HStack { Children(node: item) }
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
        if let text, #available(iOS 26, macOS 26, *) {
            content.navigationSubtitle(text)
        } else {
            content
        }
    }
}
