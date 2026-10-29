import SwiftUI

/// `<TabView>` with `<Tab>` children. Each tab's value is its `value` prop, or
/// its position. Controlled with `selection` + `onSelectionChange`, or
/// uncontrolled (just `onSelectionChange`, or nothing).
struct TabViewHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    /// The tab the user picked, until React's `selection` catches up (or for
    /// good, if `selection` isn't set).
    @State private var picked: String?

    var body: some View {
        let tabs = node.children.filter { $0.type == "Tab" }
        let values = tabs.indices.map { tabValue(tabs[$0], $0) }
        let selection = Binding<String>(
            get: { picked ?? node.string("selection") ?? values.first ?? "" },
            set: { value in
                guard value != picked ?? node.string("selection") else { return }
                picked = value
                runtime?.dispatch(node.id, "onSelectionChange", value)
            }
        )

        TabView(selection: selection) {
            ForEach(Array(tabs.enumerated()), id: \.element.id) { index, tab in
                Tab(tab.string("title") ?? "", systemImage: tab.string("systemImage") ?? "", value: values[index],
                    role: tab.string("role") == "search" ? .search : nil) {
                    TabContentView(tab: tab)
                }
                .badge(badge(tab))
                // The tab bar item's own props (the content takes the rest of a screen's).
                .accessibilityIdentifier(tab.string("accessibilityIdentifier") ?? "")
                .accessibilityLabel(Text(tab.string("accessibilityLabel") ?? tab.string("title") ?? ""))
                .accessibilityHint(Text(tab.string("accessibilityHint") ?? ""))
                .hidden(tab.bool("hidden"))
            }
        }
        .modifier(TabViewStyleModifier(node: node))
        .modifier(TabBarMinimize(behavior: node.string("tabBarMinimizeBehavior")))
        .modifier(BottomAccessory(node: node.children.first { $0.type == "TabAccessory" }))
        // Other children (a <Portal>, an effect-only component's views) aren't
        // tabs: kept mounted behind the tabs instead of dropped.
        .background {
            ForEach(node.children.filter { !["Tab", "TabAccessory"].contains($0.type) && !$0.isAttachment }) { NodeView(node: $0) }
        }
        .onChange(of: node.string("selection")) { picked = nil }
    }

    private func tabValue(_ tab: Node, _ index: Int) -> String {
        switch tab.props["value"] {
        case let s as String: s
        case let n as NSNumber: n.stringValue
        default: String(index)
        }
    }

    private func badge(_ tab: Node) -> Text? {
        switch tab.props["badge"] {
        case let n as NSNumber where n.intValue != 0: Text("\(n.intValue)")
        case let s as String where !s.isEmpty: Text(s)
        default: nil
        }
    }
}

private struct TabContentView: View {
    let tab: Node
    var body: some View {
        VStack(spacing: 0) { Children(node: tab) }
            .background { Presenters(node: tab) }
    }
}

/// `tabBarMinimizeBehavior` (iOS 26): "onScrollDown" shrinks the tab bar
/// while scrolling down (back on scroll up), "onScrollUp", or "never".
private struct TabBarMinimize: ViewModifier {
    let behavior: String?
    func body(content: Content) -> some View {
        #if os(iOS)
        if #available(iOS 26, *) {
            let minimize: TabBarMinimizeBehavior = switch behavior {
            case "onScrollDown": .onScrollDown
            case "onScrollUp": .onScrollUp
            case "never": .never
            default: .automatic
            }
            content.tabBarMinimizeBehavior(minimize)
        } else {
            content
        }
        #else
        content
        #endif
    }
}

/// `tabViewStyle="page"`: `pageIndicator` "automatic" (dots for 2+ pages),
/// "always", "never", or "backed" (dots on a dimmed capsule, readable on
/// light content).
private struct TabViewStyleModifier: ViewModifier {
    let node: Node
    func body(content: Content) -> some View {
        switch node.string("tabViewStyle") {
        #if os(iOS)
        case "page":
            let indicator = node.string("pageIndicator")
            content
                .tabViewStyle(.page(indexDisplayMode: indicator == "never" ? .never : indicator == "always" || indicator == "backed" ? .always : .automatic))
                .indexViewStyle(.page(backgroundDisplayMode: indicator == "backed" ? .always : .automatic))
        #endif
        case "sidebarAdaptable": content.tabViewStyle(.sidebarAdaptable)
        default: content
        }
    }
}

/// `<NavigationSplitView>`: children are `<SplitColumn column="sidebar" |
/// "content" | "detail">` (the JS component builds them from its props).
///
/// On iPhone the split view collapses to a stack; `preferredCompactColumn`
/// picks the column shown there (set it to "detail" when the user selects
/// something), and `onPreferredCompactColumnChange` reports the back button.
struct SplitViewHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @State private var picked: NavigationSplitViewColumn?
    @State private var visibilityPicked: NavigationSplitViewVisibility?

    var body: some View {
        // `columnVisibility`: "automatic" | "all" | "doubleColumn" | "detailOnly";
        // the user hiding or showing the sidebar reports onColumnVisibilityChange.
        let visibility = Binding<NavigationSplitViewVisibility>(
            get: { visibilityPicked ?? splitVisibility(node.string("columnVisibility")) },
            set: { value in
                visibilityPicked = value
                runtime?.dispatch(node.id, "onColumnVisibilityChange", visibilityName(value))
            }
        )
        let sidebar = column("sidebar")
        let content = column("content")
        let detail = column("detail")
        let compact = Binding<NavigationSplitViewColumn>(
            get: { picked ?? splitColumn(node.string("preferredCompactColumn")) },
            set: { value in
                guard value != picked ?? splitColumn(node.string("preferredCompactColumn")) else { return }
                picked = value
                runtime?.dispatch(node.id, "onPreferredCompactColumnChange", columnName(value))
            }
        )

        Group {
            if let content {
                NavigationSplitView(columnVisibility: visibility, preferredCompactColumn: compact) {
                    ColumnView(node: sidebar)
                } content: {
                    ColumnView(node: content)
                } detail: {
                    ColumnView(node: detail)
                }
            } else {
                NavigationSplitView(columnVisibility: visibility, preferredCompactColumn: compact) {
                    ColumnView(node: sidebar)
                } detail: {
                    ColumnView(node: detail)
                }
            }
        }
        .modifier(SplitViewStyleModifier(style: node.string("navigationSplitViewStyle")))
        .onChange(of: node.string("preferredCompactColumn")) { picked = nil }
        .onChange(of: node.string("columnVisibility")) { visibilityPicked = nil }
    }

    private func column(_ name: String) -> Node? {
        node.children.first { $0.type == "SplitColumn" && $0.string("column") == name }
    }
}

private struct ColumnView: View {
    let node: Node?
    var body: some View {
        if let node {
            VStack(spacing: 0) { Children(node: node) }
                .background { Presenters(node: node) }
        }
    }
}

private struct SplitViewStyleModifier: ViewModifier {
    let style: String?
    func body(content: Content) -> some View {
        switch style {
        case "balanced": content.navigationSplitViewStyle(.balanced)
        case "prominentDetail": content.navigationSplitViewStyle(.prominentDetail)
        default: content
        }
    }
}

private func splitVisibility(_ name: String?) -> NavigationSplitViewVisibility {
    switch name {
    case "all": .all
    case "doubleColumn": .doubleColumn
    case "detailOnly": .detailOnly
    default: .automatic
    }
}

private func visibilityName(_ visibility: NavigationSplitViewVisibility) -> String {
    switch visibility {
    case .all: "all"
    case .doubleColumn: "doubleColumn"
    case .detailOnly: "detailOnly"
    default: "automatic"
    }
}

private func splitColumn(_ name: String?) -> NavigationSplitViewColumn {
    switch name {
    case "content": .content
    case "detail": .detail
    default: .sidebar
    }
}

private func columnName(_ column: NavigationSplitViewColumn) -> String {
    switch column {
    case .content: "content"
    case .detail: "detail"
    default: "sidebar"
    }
}

/// `<TabAccessory>` in a `<TabView>`: a bar above the tab bar (iOS 26), like
/// Music's mini player. It shrinks into the tab bar as you scroll.
private struct BottomAccessory: ViewModifier {
    let node: Node?

    func body(content: Content) -> some View {
        #if os(iOS)
        if let node, #available(iOS 26, *) {
            content.tabViewBottomAccessory { Children(node: node) }
        } else {
            content
        }
        #else
        content
        #endif
    }
}
