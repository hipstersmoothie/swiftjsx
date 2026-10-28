import SwiftUI

/// `<ScrollView>` with `ref.current.scrollTo(…)` support. Its children are
/// scroll targets: `paging="view"` snaps to them, and `onScrollIndexChange`
/// reports which one is at the leading (top) edge.
struct ScrollViewHost: View {
    let node: Node
    /// For `scrollTo({ x, y })` (ScrollViewReader only scrolls to views).
    @State private var position = ScrollPosition()

    var body: some View {
        let horizontal = node.string("axis") == "horizontal"
        ScrollViewReader { proxy in
            ScrollView(horizontal ? .horizontal : .vertical) {
                Group {
                    let spacing = node.cgFloat("spacing")
                    if horizontal { HStack(spacing: spacing) { Children(node: node) } } else { VStack(spacing: spacing) { Children(node: node) } }
                }
                .scrollTargetLayout()
                .background(alignment: horizontal ? .leading : .top) {
                    Color.clear.frame(width: 1, height: 1).id(ScrollEdge.top)
                }
                .background(alignment: horizontal ? .trailing : .bottom) {
                    Color.clear.frame(width: 1, height: 1).id(ScrollEdge.end)
                }
            }
            // Rows in here aren't List rows, even inside one (a carousel in a row).
            .environment(\.inList, false)
            .modifier(ScrollOptions(node: node))
            .modifier(Position(node: node, horizontal: horizontal))
            .scrollPosition($position)
            .onChange(of: node.scrollRequest) { _, request in
                if let request, let offset = request.target.base as? ScrollOffset {
                    let jump = { position.scrollTo(point: CGPoint(x: offset.x ?? 0, y: offset.y ?? 0)) }
                    if request.animated { withAnimation(.default, jump) } else { jump() }
                } else {
                    scroll(proxy, request)
                }
            }
            // A scrollTo from before the scroll view appeared (a mount effect).
            .onAppear { scroll(proxy, node.scrollRequest) }
        }
    }

    /// `onScrollIndexChange(index)`: the child at the leading (top) edge, when
    /// it changes (a carousel's page), instead of working it out from
    /// `onScroll` every frame. Assumes children of equal size, as in pagers
    /// and carousels.
    private struct Position: ViewModifier {
        let node: Node
        let horizontal: Bool
        @Environment(\.jsxRuntime) private var runtime

        func body(content: Content) -> some View {
            if node.has("onScrollIndexChange") {
                let count = node.children.filter { !$0.isAttachment }.count
                content.onScrollGeometryChange(for: Int.self) { geo in
                    let offset = horizontal ? geo.contentOffset.x + geo.contentInsets.leading : geo.contentOffset.y + geo.contentInsets.top
                    let length = horizontal ? geo.contentSize.width : geo.contentSize.height
                    guard count > 0, length > 0 else { return 0 }
                    return min(count - 1, max(0, Int((offset / (length / CGFloat(count))).rounded())))
                } action: { _, index in
                    runtime?.dispatch(node.id, "onScrollIndexChange", index)
                }
            } else {
                content
            }
        }
    }
}

/// ScrollView and VirtualList options: `showsIndicators`, `paging`,
/// `defaultScrollAnchor` ("bottom" for chats), `contentMargins`,
/// `onScroll({ x, y, contentWidth, contentHeight, width, height })` and
/// `onScrollPhaseChange(phase)`.
struct ScrollOptions: ViewModifier {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime

    func body(content: Content) -> some View {
        content
            .scrollIndicators(node.has("showsIndicators") && !node.bool("showsIndicators") ? .hidden : .automatic)
            .defaultScrollAnchor(unitPoint(node.string("defaultScrollAnchor")))
            .contentMargins(.all, insets(node.prop("contentMargins")) ?? EdgeInsets(), for: .scrollContent)
            .modifier(Paging(mode: node.prop("paging")))
            .modifier(Events(node: node, runtime: runtime))
            .modifier(Phase(node: node, runtime: runtime))
    }

    /// `paging`: true snaps to pages the size of the scroll view; "view" snaps
    /// to children (cards that peek at the edges).
    private struct Paging: ViewModifier {
        let mode: Any?
        func body(content: Content) -> some View {
            if mode as? String == "view" {
                content.scrollTargetBehavior(.viewAligned)
            } else if (mode as? NSNumber)?.boolValue == true {
                content.scrollTargetBehavior(.paging)
            } else {
                content
            }
        }
    }

    /// `onScrollPhaseChange("idle" | "tracking" | "interacting" |
    /// "decelerating" | "animating")`: pause an auto-advancing carousel while
    /// the user drags it.
    private struct Phase: ViewModifier {
        let node: Node
        let runtime: JSXRuntime?
        func body(content: Content) -> some View {
            if node.has("onScrollPhaseChange") {
                content.onScrollPhaseChange { _, phase in
                    runtime?.dispatch(node.id, "onScrollPhaseChange", name(phase))
                }
            } else {
                content
            }
        }

        private func name(_ phase: ScrollPhase) -> String {
            switch phase {
            case .idle: "idle"
            case .tracking: "tracking"
            case .interacting: "interacting"
            case .decelerating: "decelerating"
            case .animating: "animating"
            @unknown default: "idle"
            }
        }
    }

    private struct Info: Equatable {
        var x: CGFloat, y: CGFloat, contentWidth: CGFloat, contentHeight: CGFloat, width: CGFloat, height: CGFloat
    }

    private struct Events: ViewModifier {
        let node: Node
        let runtime: JSXRuntime?
        func body(content: Content) -> some View {
            if node.has("onScroll") {
                content.onScrollGeometryChange(for: Info.self) { geo in
                    // 0 at the top, whatever the insets.
                    Info(x: geo.contentOffset.x + geo.contentInsets.leading, y: geo.contentOffset.y + geo.contentInsets.top,
                         contentWidth: geo.contentSize.width, contentHeight: geo.contentSize.height,
                         width: geo.containerSize.width, height: geo.containerSize.height)
                } action: { _, info in
                    runtime?.dispatch(node.id, "onScroll", ["x": info.x, "y": info.y, "contentWidth": info.contentWidth,
                                                            "contentHeight": info.contentHeight, "width": info.width, "height": info.height])
                }
            } else {
                content
            }
        }
    }
}

/// `<List selection onSelectionChange>`: rows with a `tag` are selectable
/// (iPad sidebars highlight the selected row).
struct SelectableList: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @State private var picked: String??

    var body: some View {
        Group {
            if node.has("onSelectionChange") || node.has("selection") {
                List(selection: Binding<String?>(
                    get: { picked ?? node.string("selection") },
                    set: { value in
                        picked = .some(value)
                        runtime?.dispatch(node.id, "onSelectionChange", value ?? NSNull())
                    }
                )) { EditableChildren(node: node) }
            } else {
                List { EditableChildren(node: node) }
            }
        }
        .environment(\.inList, true)
        .modifier(ListStyleModifier(style: node.string("listStyle")))
        .scrollContentBackground(node.string("scrollContentBackground") == "hidden" ? .hidden : .automatic)
        .onChange(of: node.string("selection")) { picked = nil }
        .modifier(ScrollRequests(node: node))
    }
}

/// `ref.current.scrollTo(…)` on a List or Form: to a row (or the row holding
/// a view), an index, or an edge.
struct ScrollRequests: ViewModifier {
    let node: Node

    func body(content: Content) -> some View {
        ScrollViewReader { proxy in
            content.onChange(of: node.scrollRequest) { _, request in scroll(proxy, request) }
        }
    }
}

/// List and Section children, with swipe-to-delete (`onDelete(indices)`) and
/// drag-to-reorder in edit mode (`onMove({ from, to })`) when given.
struct EditableChildren: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime

    var body: some View {
        if node.has("onDelete") || node.has("onMove") {
            ForEach(node.children.filter { !$0.isAttachment }) { NodeView(node: $0) }
                .onDelete(perform: node.has("onDelete") ? { runtime?.dispatch(node.id, "onDelete", Array($0)) } : nil)
                .onMove(perform: node.has("onMove") ? { runtime?.dispatch(node.id, "onMove", ["from": Array($0), "to": $1]) } : nil)
        } else {
            Children(node: node)
        }
    }
}

struct ListStyleModifier: ViewModifier {
    let style: String?
    func body(content: Content) -> some View {
        switch style {
        case "plain": content.listStyle(.plain)
        #if os(iOS)
        case "grouped": content.listStyle(.grouped)
        case "insetGrouped": content.listStyle(.insetGrouped)
        #endif
        case "inset": content.listStyle(.inset)
        case "sidebar": content.listStyle(.sidebar)
        default: content
        }
    }
}

/// `<Flow>`: lays children out left to right, wrapping onto new lines (tags, chips).
struct FlowLayout: Layout {
    var spacing: CGFloat
    var lineSpacing: CGFloat
    var alignment: HorizontalAlignment

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let lines = lines(for: subviews, width: proposal.width ?? .infinity)
        let width = lines.map(\.width).max() ?? 0
        let height = lines.map(\.height).reduce(0, +) + lineSpacing * CGFloat(max(lines.count - 1, 0))
        return CGSize(width: proposal.width ?? width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var y = bounds.minY
        for line in lines(for: subviews, width: bounds.width) {
            var x = switch alignment {
            case .center: bounds.minX + (bounds.width - line.width) / 2
            case .trailing: bounds.maxX - line.width
            default: bounds.minX
            }
            for index in line.indices {
                let size = subviews[index].sizeThatFits(.unspecified)
                subviews[index].place(at: CGPoint(x: x, y: y + (line.height - size.height) / 2), proposal: ProposedViewSize(size))
                x += size.width + spacing
            }
            y += line.height + lineSpacing
        }
    }

    private struct Line { var indices: [Int] = []; var width: CGFloat = 0; var height: CGFloat = 0 }

    private func lines(for subviews: Subviews, width: CGFloat) -> [Line] {
        var lines: [Line] = []
        var line = Line()
        for (index, subview) in subviews.enumerated() {
            let size = subview.sizeThatFits(.unspecified)
            let needed = line.indices.isEmpty ? size.width : line.width + spacing + size.width
            if needed > width, !line.indices.isEmpty {
                lines.append(line)
                line = Line()
            }
            line.width = line.indices.isEmpty ? size.width : line.width + spacing + size.width
            line.height = max(line.height, size.height)
            line.indices.append(index)
        }
        if !line.indices.isEmpty { lines.append(line) }
        return lines
    }
}

/// `<VirtualList>`: lays out `count` lazy slots, renders React's rows for the
/// ones it has, placeholders for the rest, and tells React which slots are on
/// screen so it can render just those.
///
/// The list body only depends on `count` and style props, never on the rows:
/// rebuilding a ForEach over 100k slots on every React commit stalled the main
/// thread for ~1 s per commit on an iPhone 15 Pro Max. Each slot looks up its
/// own row instead, so a commit only re-evaluates the slots on screen.
struct VirtualListHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @State private var visible = VisibleRange()
    @State private var heights = RowHeights()

    var body: some View {
        let count = max(0, Int(node.double("count") ?? 0))
        let layout = SlotLayout(fixed: node.cgFloat("itemHeight"), estimated: node.cgFloat("estimatedItemHeight") ?? 44)
        SwiftJSXDiagnostics.virtualListBodies += 1

        #if os(iOS)
        // listStyle="list" on iOS: a UICollectionView list with SwiftUI cells.
        // SwiftUI's List looks a row up by walking its ForEach from the start,
        // so its cells get slower the further down you are (unusable after
        // jumping to row 50,000 of 100k); UIKit finds cells by index.
        if node.string("listStyle") == "list" {
            return AnyView(CollectionList(node: node, count: count, layout: layout, runtime: runtime)
                .background { CollectionList.background(node).ignoresSafeArea() })
        }
        #endif
        if node.string("listStyle") != "list" {
            return AnyView(VirtualStack(node: node, count: count, layout: layout, heights: heights) { slots(count: count, layout: $0) })
        }
        // listStyle="list" off iOS: SwiftUI's List.
        return AnyView(ScrollViewReader { proxy in
            Group {
                if let fixed = layout.fixed {
                    // Rows exactly as tall as the list estimates, so self-sizing
                    // never disagrees with the estimate (see VirtualSlot).
                    List { slots(count: count, layout: layout) }
                        .environment(\.defaultMinListRowHeight, fixed)
                } else {
                    List { slots(count: count, layout: layout) }
                }
            }
            .onChange(of: node.scrollRequest) { _, request in scroll(proxy, request) }
        })
    }

    private func slots(count: Int, layout: SlotLayout) -> some View {
        ForEach(0..<count, id: \.self) { index in
            VirtualSlot(list: node, index: index, layout: layout)
                .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { [heights] in heights.record(index, $0) }
                .onAppear { visible.update(inserting: index, report: report) }
                .onDisappear { visible.update(removing: index, report: report) }
        }
    }

    private func report(_ first: Int, _ last: Int) {
        runtime?.dispatch(node.id, "onRangeChange", ["first": first, "last": last])
    }
}

/// The default VirtualList: a LazyVStack in a ScrollView.
///
/// `scrollTo(index)` sets the offset directly (`index × (row height +
/// spacing)`) instead of using ScrollViewReader: `ScrollViewProxy.scrollTo`
/// finds a row by searching the lazy stack's rows from the top, which froze
/// the main thread for ~10 s when jumping to row 50,000 of 100k. With
/// `itemHeight` the jump is exact; otherwise it uses `estimatedItemHeight`.
private struct VirtualStack<Slots: View>: View {
    let node: Node
    let count: Int
    let layout: SlotLayout
    let heights: RowHeights
    @ViewBuilder let slots: (SlotLayout) -> Slots
    @State private var position = ScrollPosition()
    @State private var viewport: CGFloat = 0
    @State private var headerHeight: CGFloat = 0

    var body: some View {
        let spacing = node.cgFloat("spacing") ?? 0
        ScrollView {
            if node.has("columns") {
                LazyVGrid(columns: gridColumns(node), spacing: spacing) { section }
            } else {
                LazyVStack(spacing: spacing) { section }
            }
        }
        .modifier(ScrollOptions(node: node))
        .scrollPosition($position)
        .onScrollGeometryChange(for: CGFloat.self) { $0.containerSize.height } action: { _, height in viewport = height }
        .onChange(of: node.scrollRequest) { _, request in
            guard let request else { return }
            let jump = { scroll(to: request, spacing: spacing) }
            if request.animated { withAnimation(.default, jump) } else { jump() }
        }
        .onAppear { if let request = node.scrollRequest { scroll(to: request, spacing: spacing) } }
    }

    /// `header` / `footer` (VirtualListHeader / VirtualListFooter children):
    /// full-width views above and below the rows that scroll with them.
    private var section: some View {
        let header = node.children.first { $0.type == "VirtualListHeader" }
        let footer = node.children.first { $0.type == "VirtualListFooter" }
        return Section {
            slots(layout)
        } header: {
            if let header {
                NodeView(node: header)
                    .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { headerHeight = $0 }
            }
        } footer: {
            if let footer { NodeView(node: footer) }
        }
    }

    private func scroll(to request: ScrollRequest, spacing: CGFloat) {
        switch request.target.base {
        case let edge as ScrollEdge:
            position.scrollTo(edge: edge == .top ? .top : .bottom)
        case let offset as ScrollOffset:
            position.scrollTo(point: CGPoint(x: offset.x ?? 0, y: offset.y ?? 0))
        case let index as Int:
            let row = layout.fixed ?? layout.estimated
            // Grids: rows of `columns` (adaptive columns count as one per row: an estimate).
            let perRow = max(1, Int(node.double("columns") ?? 1))
            let header = headerHeight > 0 ? headerHeight + spacing : 0
            let target = min(max(index, 0), max(count - 1, 0))
            // Rows of varying height: the ones measured so far, estimates for the rest.
            let top = perRow == 1 && layout.fixed == nil
                ? header + heights.offset(of: target, estimated: row, spacing: spacing)
                : header + CGFloat(target / perRow) * (row + spacing)
            let y: CGFloat = switch request.anchor {
            case .center?: top - (viewport - row) / 2
            case .bottom?: top - (viewport - row)
            default: top
            }
            position.scrollTo(y: max(0, y))
        default:
            break
        }
    }
}

struct SlotLayout: Equatable {
    /// `itemHeight`: every row is exactly this tall (fastest; no jumps when a
    /// placeholder becomes a row).
    var fixed: CGFloat?
    /// `estimatedItemHeight`: placeholder height for self-sizing rows.
    var estimated: CGFloat
}

/// One slot: React's row for `index` if it has rendered one, else a placeholder.
/// Reading `list.children` here (not in the list body) scopes Observation
/// invalidation to on-screen slots.
struct VirtualSlot: View {
    let list: Node
    let index: Int
    let layout: SlotLayout

    var body: some View {
        let row = list.children.first { Int($0.double("index") ?? -1) == index }
        // A ZStack, not a Group: List treats a Group's contents as its own rows,
        // so swapping placeholder ⇄ row inside a Group changed the *list's*
        // structure and made SwiftUI re-walk all `count` slots (~1 s per update
        // at 100k on an iPhone). A ZStack is one opaque row.
        ZStack(alignment: .leading) {
            if let row {
                VStack(alignment: .leading, spacing: 0) { Children(node: row) }
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                Color.clear
            }
        }
        .frame(height: layout.fixed ?? (row == nil ? layout.estimated : nil))
        .listRowInsets(layout.fixed == nil ? nil : EdgeInsets(top: 0, leading: 20, bottom: 0, trailing: 20))
        .onAppear { if row != nil { SwiftJSXDiagnostics.renderedSlots.insert(index) } }
        .onChange(of: row == nil) { _, missing in
            if missing { SwiftJSXDiagnostics.renderedSlots.remove(index) } else { SwiftJSXDiagnostics.renderedSlots.insert(index) }
        }
        .onDisappear { SwiftJSXDiagnostics.renderedSlots.remove(index) }
    }
}

/// Heights of the rows laid out so far, so `scrollTo(index)` lands on the
/// row even when rows vary (unmeasured ones count as the estimate).
@MainActor
final class RowHeights {
    private var heights: [Int: CGFloat] = [:]

    func record(_ index: Int, _ height: CGFloat) {
        heights[index] = height
    }

    func offset(of index: Int, estimated: CGFloat, spacing: CGFloat) -> CGFloat {
        var y: CGFloat = 0
        for i in 0..<index { y += (heights[i] ?? estimated) + spacing }
        return y
    }
}

/// Tracks on-screen slots and reports the range at most once per runloop turn.
@MainActor
final class VisibleRange {
    private var indices = Set<Int>()
    private var scheduled = false
    private var lastReported: (Int, Int)?

    func update(inserting index: Int, report: @escaping (Int, Int) -> Void) {
        indices.insert(index)
        SwiftJSXDiagnostics.visibleSlots.insert(index)
        schedule(report)
    }

    func update(removing index: Int, report: @escaping (Int, Int) -> Void) {
        indices.remove(index)
        SwiftJSXDiagnostics.visibleSlots.remove(index)
        schedule(report)
    }

    private func schedule(_ report: @escaping (Int, Int) -> Void) {
        guard !scheduled else { return }
        scheduled = true
        DispatchQueue.main.async { [self] in
            MainActor.assumeIsolated {
                scheduled = false
                guard let first = indices.min(), let last = indices.max() else { return }
                if let (f, l) = lastReported, f == first, l == last { return }
                lastReported = (first, last)
                report(first, last)
            }
        }
    }
}

@MainActor
private func scroll(_ proxy: ScrollViewProxy, _ request: ScrollRequest?) {
    guard let request else { return }
    // Pass the concrete ID type: a List only matches ids of its ForEach's ID
    // type (Int), not the same value wrapped in AnyHashable.
    let go = {
        if let id = request.target.base as? Int {
            proxy.scrollTo(id, anchor: request.anchor)
        } else if let edge = request.target.base as? ScrollEdge {
            proxy.scrollTo(edge, anchor: request.anchor)
        } else {
            proxy.scrollTo(request.target, anchor: request.anchor)
        }
    }
    if request.animated { withAnimation(.default, go) } else { go() }
}

#if os(iOS)
/// `<SwipeActions>` on a row that isn't in a List (a ScrollView or
/// VirtualList stack of rows): the row slides over its actions. A sideways
/// drag reveals them (vertical drags still scroll), past half they stay
/// open, a full swipe (`allowsFullSwipe`) runs the first one, and tapping
/// the open row closes it. One row is open at a time.
struct SwipeRow<Content: View>: View {
    let node: Node
    @ViewBuilder let content: Content
    @Environment(\.jsxRuntime) private var runtime
    @State private var offset: CGFloat = 0
    @State private var settled: CGFloat = 0
    @State private var width: CGFloat = 0
    private let buttonWidth: CGFloat = 76

    var body: some View {
        let sets = node.children.filter { $0.type == "SwipeActions" }
        let leadingSet = sets.first { $0.string("edge") == "leading" }
        let trailingSet = sets.first { $0.string("edge") != "leading" }
        let leading = buttons(leadingSet), trailing = buttons(trailingSet)
        ZStack {
            HStack(spacing: 0) {
                ForEach(leading) { action($0) }
                Spacer(minLength: 0)
                ForEach(trailing) { action($0) }
            }
            .opacity(offset == 0 ? 0 : 1)
            content
                .offset(x: offset)
                .overlay {
                    // While open, a tap on the row closes it (instead of opening it).
                    if settled != 0 { Color.clear.contentShape(Rectangle()).onTapGesture { close() } }
                }
                .gesture(AxisPan(horizontal: true) { state, event in
                    drag(state, event, leading: CGFloat(leading.count) * buttonWidth, trailing: CGFloat(trailing.count) * buttonWidth,
                         leadingSet: leadingSet, trailingSet: trailingSet)
                })
        }
        .clipped()
        .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { width = $0 }
        .onChange(of: SwipeRows.shared.open) { _, open in if open != node.id, settled != 0 { close() } }
    }

    private func buttons(_ set: Node?) -> [Node] {
        set?.children.filter { $0.type == "Button" } ?? []
    }

    private func action(_ button: Node) -> some View {
        let fill = color(button.prop("tint")) ?? (button.string("role") == "destructive" ? Color.red : Color.gray)
        return Button {
            run(button)
        } label: {
            Group {
                if let title = button.string("title") { Text(title) } else { VStack(spacing: 4) { Children(node: button) } }
            }
            .font(.subheadline.weight(.medium))
            .foregroundStyle(.white)
            .frame(width: buttonWidth)
            .frame(maxHeight: .infinity)
            .background(fill)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(button.string("accessibilityIdentifier") ?? "")
    }

    private func run(_ button: Node) {
        if button.has("onPress") { runtime?.fire(button, "onPress") }
        close()
    }

    private func drag(_ state: UIGestureRecognizer.State, _ event: [String: Any], leading: CGFloat, trailing: CGFloat,
                      leadingSet: Node?, trailingSet: Node?) {
        let dx = ((event["translation"] as? [String: Double])?["x"]).map { CGFloat($0) } ?? 0
        let vx = ((event["velocity"] as? [String: Double])?["x"]).map { CGFloat($0) } ?? 0
        let fullLeading = leadingSet?.bool("allowsFullSwipe") == true, fullTrailing = trailingSet?.bool("allowsFullSwipe") == true
        switch state {
        case .began, .changed:
            if state == .began { SwipeRows.shared.open = node.id }
            var x = settled + dx
            // No actions that way: stay put; past them: resist (unless a full swipe can happen).
            x = min(x, leading == 0 ? 0 : (fullLeading ? width : leading + (x - leading) / 4))
            x = max(x, trailing == 0 ? 0 : (fullTrailing ? -width : -trailing + (x + trailing) / 4))
            offset = x
        default:
            let x = offset
            if fullTrailing, x < -width * 0.6, let first = trailingSet.flatMap({ buttons($0).first }) {
                withAnimation(.easeOut(duration: 0.2)) { offset = -width }
                run(first)
            } else if fullLeading, x > width * 0.6, let first = leadingSet.flatMap({ buttons($0).first }) {
                withAnimation(.easeOut(duration: 0.2)) { offset = width }
                run(first)
            } else if trailing > 0, x < -trailing / 2 || (x < 0 && vx < -600) {
                settle(-trailing)
            } else if leading > 0, x > leading / 2 || (x > 0 && vx > 600) {
                settle(leading)
            } else {
                close()
            }
        }
    }

    private func settle(_ x: CGFloat) {
        SwipeRows.shared.open = node.id
        withAnimation(.spring(duration: 0.3, bounce: 0.15)) {
            settled = x
            offset = x
        }
    }

    private func close() {
        withAnimation(.spring(duration: 0.3, bounce: 0.1)) {
            settled = 0
            offset = 0
        }
    }
}

/// Which swipe row is open (opening one closes the others).
@MainActor @Observable
final class SwipeRows {
    static let shared = SwipeRows()
    var open: Int?
}
#endif
