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
            }
        }
        .modifier(TabViewStyleModifier(style: node.string("tabViewStyle")))
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

private struct TabViewStyleModifier: ViewModifier {
    let style: String?
    func body(content: Content) -> some View {
        switch style {
        #if os(iOS)
        case "page": content.tabViewStyle(.page(indexDisplayMode: .automatic))
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

    var body: some View {
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
                NavigationSplitView(preferredCompactColumn: compact) {
                    ColumnView(node: sidebar)
                } content: {
                    ColumnView(node: content)
                } detail: {
                    ColumnView(node: detail)
                }
            } else {
                NavigationSplitView(preferredCompactColumn: compact) {
                    ColumnView(node: sidebar)
                } detail: {
                    ColumnView(node: detail)
                }
            }
        }
        .modifier(SplitViewStyleModifier(style: node.string("navigationSplitViewStyle")))
        .onChange(of: node.string("preferredCompactColumn")) { picked = nil }
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
